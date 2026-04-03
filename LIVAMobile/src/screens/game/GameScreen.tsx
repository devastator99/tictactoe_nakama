import React, {useEffect, useCallback, useState, useRef, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  Alert,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, BorderRadius} from '../../theme/colors';
import {rf, ms} from '../../utils/responsive';
import Button from '../../components/common/Button';
import Card from '../../components/common/GlassCard';
import GameBoard from '../../components/game/GameBoard';
import PlayerCard from '../../components/game/PlayerCard';
import GameOverOverlay from '../../components/game/GameOverOverlay';
import StatusScreen from '../../components/common/StatusScreen';
import {useAuthStore, useGameStore} from '../../store';
import {useNakama} from '../../hooks/useNakama';

export default function GameScreen({navigation, route}: any) {
  const {matchId} = route.params || {};
  const {user} = useAuthStore();
  const {gameState, matchId: currentMatchId} = useGameStore();
  const {joinMatch, leaveMatch, makeMove, makeQuantumMove, requestRematch} = useNakama();

  const [isLoading, setIsLoading] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isQuantumArmed, setIsQuantumArmed] = useState(false);
  const [quantumSelection, setQuantumSelection] = useState<number[]>([]);

  const isBackPressHandled = useRef(false);

  const attemptJoinMatch = useCallback(async () => {
    if (!matchId) {
      navigation.goBack();
      return;
    }
    try {
      setIsLoading(true);
      setJoinError(null);
      await joinMatch(matchId);
    } catch (error: any) {
      setJoinError(error.message || 'Unable to join match.');
    } finally {
      setIsLoading(false);
    }
  }, [matchId, joinMatch, navigation]);

  useEffect(() => {
    if (!matchId) {
      navigation.goBack();
      return;
    }
    if (matchId !== currentMatchId) {
      attemptJoinMatch();
    } else {
      setIsLoading(false);
    }
  }, [attemptJoinMatch, currentMatchId, matchId, navigation]);

  useEffect(() => {
    if (gameState?.phase === 'game_over') {
      setShowGameOver(true);
    } else {
      setShowGameOver(false);
    }
  }, [gameState?.phase]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showGameOver) return false;
      if (!isBackPressHandled.current) {
        isBackPressHandled.current = true;
        Alert.alert('Leave Match?', 'Are you sure you want to leave?', [
          {text: 'Cancel', onPress: () => {isBackPressHandled.current = false;}, style: 'cancel'},
          {text: 'Leave', onPress: () => {leaveMatch(); navigation.goBack();}, style: 'destructive'},
        ]);
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [leaveMatch, navigation, showGameOver]);

  const currentPlayer = useMemo(
    () => gameState?.players.find(p => p.userId === user?.userId),
    [gameState, user],
  );
  const opponent = useMemo(
    () => gameState?.players.find(p => p.userId !== user?.userId),
    [gameState, user],
  );
  const isMyTurn = gameState?.currentTurn === user?.userId;

  const handleCellClick = useCallback(
    (position: number) => {
      if (!isMyTurn || !gameState || gameState.phase !== 'playing') return;
      if (gameState.board[position] !== null) return;

      if (isQuantumArmed && !(gameState.quantumUsed?.[user?.userId || ''])) {
        const alreadySelected = quantumSelection.includes(position);
        const updatedSelection = alreadySelected
          ? quantumSelection.filter(value => value !== position)
          : [...quantumSelection, position].slice(0, 2);

        setQuantumSelection(updatedSelection);

        if (updatedSelection.length === 2) {
          makeQuantumMove(updatedSelection);
          setQuantumSelection([]);
          setIsQuantumArmed(false);
        }
        return;
      }

      makeMove(position);
    },
    [isMyTurn, gameState, isQuantumArmed, user?.userId, quantumSelection, makeMove, makeQuantumMove],
  );

  const handleRematch = () => {
    setShowGameOver(false);
    requestRematch();
  };

  const handleExit = () => {
    leaveMatch();
    navigation.goBack();
  };

  if (isLoading) {
    return <StatusScreen title="Joining Match" message="Connecting to game server..." isLoading />;
  }

  if (joinError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Failed to Join</Text>
          <Text style={styles.errorMessage}>{joinError}</Text>
          <Button
            title="Go Back"
            onPress={() => {leaveMatch(); navigation.goBack();}}
            variant="primary"
            size="lg"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!gameState) {
    return <StatusScreen title="Waiting" message="Waiting for match to start..." isLoading />;
  }

  const isGameOver = gameState.phase === 'game_over';
  const winnerId = gameState.winner;
  const quantumUsedByMe = Boolean(gameState.quantumUsed?.[user?.userId || '']);
  const statusText = isGameOver
    ? winnerId === user?.userId
      ? 'You won the board'
      : winnerId
      ? `${opponent?.username || 'Opponent'} won`
      : 'Draw game'
    : isMyTurn
    ? 'Your turn'
    : "Opponent's turn";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Card variant="elevated" style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>LIVE MATCH</Text>
          <Text style={styles.heroTitle}>Focused board, clean moves.</Text>
          <Text style={styles.heroSubtitle}>
            {gameState.mode.replace(/_/g, ' ')} mode with server-authoritative turns.
          </Text>
        </Card>

        <View style={styles.playerRow}>
          <PlayerCard
            player={currentPlayer}
            isCurrentTurn={Boolean(isMyTurn)}
            isWinner={winnerId === currentPlayer?.userId}
            gamePhase={gameState.phase}
          />
          <PlayerCard
            player={opponent}
            isCurrentTurn={!isMyTurn && gameState.phase === 'playing'}
            isWinner={winnerId === opponent?.userId}
            gamePhase={gameState.phase}
            isOpponent
          />
        </View>

        <Card variant="elevated" style={styles.boardCard}>
          <Text style={styles.boardStatus}>{statusText}</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoChip}>
              <Text style={styles.infoLabel}>Mode</Text>
              <Text style={styles.infoValue}>{gameState.mode.replace(/_/g, ' ')}</Text>
            </View>
            <View style={styles.infoChip}>
              <Text style={styles.infoLabel}>Moves</Text>
              <Text style={styles.infoValue}>{gameState.moveCount}</Text>
            </View>
          </View>
          <GameBoard
            board={gameState.board}
            onCellClick={handleCellClick}
            disabled={!isMyTurn || isGameOver}
            winLine={gameState.winLine}
            selectedCells={quantumSelection}
            isQuantumArmed={isQuantumArmed}
          />
        </Card>

        <View style={styles.actionRow}>
          {!isGameOver && (
            <>
              <Button
                title="Leave Game"
                onPress={handleExit}
                variant="secondary"
                size="md"
                style={styles.actionButton}
              />
              {!quantumUsedByMe && isMyTurn && (
                <Button
                  title={isQuantumArmed ? 'Cancel Quantum' : 'Quantum Move'}
                  onPress={() => {
                    setIsQuantumArmed(!isQuantumArmed);
                    setQuantumSelection([]);
                  }}
                  variant={isQuantumArmed ? 'primary' : 'outline'}
                  size="md"
                  style={styles.actionButton}
                />
              )}
            </>
          )}
          {isGameOver && (
            <>
              <Button
                title="Replay"
                onPress={() => gameState.matchId && navigation.navigate('Replay', {matchId: gameState.matchId})}
                variant="secondary"
                size="md"
                style={styles.actionButton}
              />
              <Button
                title="Rematch"
                onPress={handleRematch}
                variant="primary"
                size="md"
                style={styles.actionButton}
              />
            </>
          )}
        </View>
      </ScrollView>

      <GameOverOverlay
        visible={showGameOver}
        gameState={gameState}
        userId={user?.userId || null}
        onRematch={handleRematch}
        onExit={handleExit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    padding: ms(20),
    gap: ms(18),
  },
  heroCard: {
    width: '100%',
  },
  heroEyebrow: {
    fontSize: rf(10),
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.text.muted,
    marginBottom: ms(10),
  },
  heroTitle: {
    fontSize: rf(28),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: ms(8),
  },
  heroSubtitle: {
    fontSize: rf(14),
    color: Colors.text.secondary,
    lineHeight: rf(21),
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ms(24),
    gap: ms(16),
  },
  errorTitle: {
    fontSize: rf(20),
    fontWeight: '600',
    color: Colors.ui.error,
  },
  errorMessage: {
    fontSize: rf(14),
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    gap: ms(12),
  },
  boardCard: {
    width: '100%',
    alignItems: 'center',
  },
  boardStatus: {
    fontSize: rf(18),
    fontWeight: '700',
    color: Colors.primary.blue,
    marginBottom: ms(18),
  },
  infoRow: {
    flexDirection: 'row',
    gap: ms(10),
    marginBottom: ms(16),
  },
  infoChip: {
    minWidth: ms(110),
    paddingHorizontal: ms(14),
    paddingVertical: ms(10),
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: rf(10),
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.text.muted,
    marginBottom: ms(4),
  },
  infoValue: {
    fontSize: rf(13),
    fontWeight: '700',
    color: Colors.text.primary,
    textTransform: 'capitalize',
  },
  actionRow: {
    flexDirection: 'row',
    gap: ms(12),
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
  },
});
