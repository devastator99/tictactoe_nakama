import {useEffect, useCallback} from 'react';
import {Alert} from 'react-native';
import {useAuthStore, useGameStore} from '../store';
import {nakamaService, MessageHandler} from '../services/nakama.service';
import type {GameMode, GameState, PlayerInfo} from '../types';
import {getStorageItem, setStorageItem} from '../utils/storage';

const generateDeviceId = (): string => {
  let id = getStorageItem('device.id');
  if (id) return id;
  id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  setStorageItem('device.id', id);
  return id;
};

export function useNakama() {
  const {login, logout} = useAuthStore();
  const {
    isConnected,
    setGameState,
    setMatchId,
    setConnected,
    setVoiceSignal,
    reset: resetGame,
  } = useGameStore();

  const authenticate = useCallback(
    async (username?: string) => {
      try {
        const deviceId = generateDeviceId();
        const session = await nakamaService.authenticateDevice(
          deviceId,
          username,
        );
        const authUser = {
          userId: session.user_id || '',
          username: session.username || username || 'Player',
          token: session.token,
        };
        login(authUser);
        return authUser;
      } catch (error: any) {
        Alert.alert('Authentication Failed', error.message);
        throw error;
      }
    },
    [login],
  );

  const connect = useCallback(async () => {
    try {
      await nakamaService.connect();
    } catch (error: any) {
      Alert.alert('Connection Failed', error.message);
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    await nakamaService.disconnect();
    resetGame();
  }, [resetGame]);

  const signOut = useCallback(async () => {
    await nakamaService.signOut();
    logout();
    resetGame();
  }, [logout, resetGame]);

  const findMatch = useCallback(
    async (mode: GameMode = 'classic') => {
      try {
        const result = await nakamaService.findOrCreateMatch(mode);
        if (!result.direct) {
          const ticket = await nakamaService.addToMatchmaker(mode);
          return {...result, ticket};
        }
        return result;
      } catch (error: any) {
        Alert.alert('Matchmaking Failed', error.message);
        throw error;
      }
    },
    [],
  );

  const createPrivateMatch = useCallback(
    async (mode: GameMode = 'classic') => {
      try {
        return await nakamaService.createPrivateMatch(mode);
      } catch (error: any) {
        Alert.alert('Room Creation Failed', error.message);
        throw error;
      }
    },
    [],
  );

  const joinPrivateMatch = useCallback(async (code: string) => {
    try {
      const result = await nakamaService.joinPrivateMatch(code);
      return result.matchId;
    } catch (error: any) {
      Alert.alert('Join Failed', 'Invalid room code');
      throw error;
    }
  }, []);

  const joinMatch = useCallback(
    async (matchId: string) => {
      try {
        await nakamaService.joinMatch(matchId);
        setMatchId(matchId);
      } catch (error: any) {
        Alert.alert('Join Match Failed', error.message);
        throw error;
      }
    },
    [setMatchId],
  );

  const leaveMatch = useCallback(async () => {
    try {
      await nakamaService.leaveMatch();
      setMatchId(null);
      setGameState(null);
    } catch (error) {
      console.error('Failed to leave match:', error);
    }
  }, [setMatchId, setGameState]);

  const makeMove = useCallback(async (position: number) => {
    try {
      await nakamaService.sendMove(position);
    } catch (error: any) {
      Alert.alert('Move Failed', error.message);
    }
  }, []);

  const makeQuantumMove = useCallback(async (positions: number[]) => {
    try {
      await nakamaService.sendQuantumMove(positions);
    } catch (error: any) {
      Alert.alert('Quantum Move Failed', error.message);
    }
  }, []);

  const requestRematch = useCallback(async () => {
    try {
      await nakamaService.requestRematch();
    } catch (error: any) {
      Alert.alert('Rematch Failed', error.message);
    }
  }, []);

  const messageHandler: MessageHandler = useCallback(
    (opCode, data) => {
      switch (opCode) {
        case 1:
          setGameState(data as GameState);
          break;
        case 3: {
          const gameOverData = data as {
            reason?: string;
            forfeiter?: string;
          };
          if (gameOverData?.reason === 'timeout') {
            Alert.alert(
              'Game Over',
              `${gameOverData.forfeiter} forfeited by timeout!`,
            );
          } else if (gameOverData?.reason === 'disconnect') {
            Alert.alert(
              'Game Over',
              `${gameOverData.forfeiter} disconnected`,
            );
          }
          break;
        }
        case 4: {
          const joinedPlayer = data as PlayerInfo;
          console.log(`${joinedPlayer.username} joined`);
          break;
        }
        case 5: {
          const playerLeftData = data as {
            username?: string;
            reason?: string;
          };
          if (playerLeftData?.reason === 'disconnect') {
            Alert.alert('Notice', 'Opponent disconnected. Waiting...');
          }
          break;
        }
        case 8:
          setVoiceSignal(data as any);
          break;
        default:
          break;
      }
    },
    [setGameState, setVoiceSignal],
  );

  const onMatchmakerMatched = useCallback(
    (callback: (matchId: string) => void) => {
      nakamaService.onMatchmakerMatched(callback);
    },
    [],
  );

  useEffect(() => {
    nakamaService.setMessageHandler(messageHandler);
    nakamaService.setConnectionHandler(setConnected);
    return () => {
      nakamaService.removeMessageHandler();
      nakamaService.removeConnectionHandler();
    };
  }, [messageHandler, setConnected]);

  return {
    authenticate,
    logout: signOut,
    connect,
    disconnect,
    isConnected,
    findMatch,
    createPrivateMatch,
    joinPrivateMatch,
    onMatchmakerMatched,
    joinMatch,
    leaveMatch,
    makeMove,
    makeQuantumMove,
    requestRematch,
  };
}
