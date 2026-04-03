import { useEffect, useCallback } from 'react'
import { useAuthStore, useGameStore } from '../context/store'
import { nakamaService, MessageHandler } from '../services/nakama.service'
import { OpCode, GameMode, GameState, PlayerInfo, VoiceSignalMessage } from '../types'
import { buildDisplayUsername, getErrorMessage, getOrCreateDeviceId } from '../lib/client-utils'
import { logger } from '../lib/logger'
import toast from 'react-hot-toast'

export function useNakama() {
  const { user, login, logout } = useAuthStore()
  const { isConnected, setGameState, setMatchId, setConnected, setVoiceSignal, reset: resetGame } = useGameStore()

  const notifyError = useCallback((context: string, error: unknown, fallbackMessage: string) => {
    logger.error({ error: error }, context)
    toast.error(getErrorMessage(error, fallbackMessage))
  }, [])

  // ── Authentication ────────────────────────────────────────────────────────
  const authenticate = useCallback(async (username?: string) => {
    try {
      const deviceId = getOrCreateDeviceId()
      const session = await nakamaService.authenticateDevice(deviceId, username)
      const user = {
        userId: session.user_id || '',
        username: buildDisplayUsername(session.user_id, session.username || username),
        token: session.token,
      }

      login(user)
      return user
    } catch (error) {
      notifyError('Authentication failed', error, 'Failed to authenticate')
      throw error
    }
  }, [login, notifyError])

  const updateUsername = useCallback(async (username: string) => {
    try {
      await nakamaService.updateUsername(username)
      if (user) {
        login({ ...user, username })
      }
    } catch (error) {
      notifyError('Failed to update username', error, 'Failed to update username')
    }
  }, [user, login, notifyError])

  // ── Connection Management ─────────────────────────────────────────────────
  const connect = useCallback(async () => {
    try {
      await nakamaService.connect()
    } catch (error) {
      notifyError('Connection failed', error, 'Failed to connect to game server')
      throw error
    }
  }, [notifyError])

  const disconnect = useCallback(async () => {
    await nakamaService.disconnect()
    resetGame()
  }, [resetGame])

  const signOut = useCallback(async () => {
    await nakamaService.signOut()
    logout()
    resetGame()
  }, [logout, resetGame])

  // ── Matchmaking ───────────────────────────────────────────────────────────
  const findMatch = useCallback(async (mode: 'classic' | 'timed' | 'vs_ai_easy' | 'vs_ai_medium' | 'vs_ai_hard' = 'classic') => {
    try {
      const result = await nakamaService.findOrCreateMatch(mode)
      if (!result.direct) {
        const ticket = await nakamaService.addToMatchmaker(mode)
        return { ...result, ticket }
      }
      return result
    } catch (error) {
      notifyError('Failed to find match', error, 'Failed to find match')
      throw error
    }
  }, [notifyError])

  const createPrivateMatch = useCallback(async (mode: GameMode = 'classic') => {
    try {
      const result = await nakamaService.createPrivateMatch(mode)
      return result
    } catch (error) {
      notifyError('Failed to create private match', error, 'Failed to create private room')
      throw error
    }
  }, [notifyError])

  const joinPrivateMatch = useCallback(async (code: string) => {
    try {
      const result = await nakamaService.joinPrivateMatch(code)
      return result.matchId
    } catch (error) {
      notifyError('Failed to join private match', error, 'Invalid room code')
      throw error
    }
  }, [notifyError])

  const cancelMatchmaking = useCallback(async (ticket: string) => {
    try {
      await nakamaService.removeFromMatchmaker(ticket)
    } catch (error) {
      notifyError('Failed to cancel matchmaking', error, 'Failed to cancel matchmaking')
      throw error
    }
  }, [notifyError])

  // ── Match Management ──────────────────────────────────────────────────────
  const joinMatch = useCallback(async (matchId: string) => {
    try {
      await nakamaService.joinMatch(matchId)
      setMatchId(matchId)
    } catch (error) {
      notifyError('Failed to join match', error, 'Failed to join match')
      throw error
    }
  }, [setMatchId, notifyError])

  const leaveMatch = useCallback(async () => {
    try {
      await nakamaService.leaveMatch()
      setMatchId(null)
      setGameState(null)
    } catch (error) {
      logger.error({ error: error }, 'Failed to leave match')
    }
  }, [setMatchId, setGameState])

  const makeMove = useCallback(async (position: number) => {
    try {
      await nakamaService.sendMove(position)
    } catch (error) {
      notifyError('Failed to make move', error, 'Failed to make move')
    }
  }, [notifyError])

  const makeQuantumMove = useCallback(async (positions: number[]) => {
    try {
      await nakamaService.sendQuantumMove(positions)
    } catch (error) {
      notifyError('Failed to make quantum move', error, 'Failed to make quantum move')
    }
  }, [notifyError])

  const requestRematch = useCallback(async () => {
    try {
      await nakamaService.requestRematch()
    } catch (error) {
      notifyError('Failed to request rematch', error, 'Failed to request rematch')
    }
  }, [notifyError])

  const sendVoiceSignal = useCallback(async (
    signalType: 'offer' | 'answer' | 'ice-candidate' | 'mute-state',
    payload: unknown,
    targetUserId?: string,
  ) => {
    try {
      await nakamaService.sendVoiceSignal(signalType, payload, targetUserId)
    } catch (error) {
      notifyError('Failed to send voice signal', error, 'Voice connection signal failed')
    }
  }, [notifyError])

  // ── Message Handler ───────────────────────────────────────────────────────
  const messageHandler: MessageHandler = useCallback((opCode, data) => {
    switch (opCode) {
      case OpCode.GAME_STATE:
        setGameState(data as GameState)
        break

      case OpCode.GAME_START: {
        toast.success('Game started!')
        break
      }

      case OpCode.GAME_OVER: {
        const gameOverData = data as { reason?: string; forfeiter?: string }
        if (gameOverData?.reason === 'timeout') {
          toast.error(`${gameOverData.forfeiter} forfeited by timeout!`)
        } else if (gameOverData?.reason === 'disconnect') {
          toast.error(`${gameOverData.forfeiter} disconnected and forfeited`)
        } else {
          toast.success('Game over!')
        }
        break
      }

      case OpCode.PLAYER_JOINED: {
        const joinedPlayer = data as PlayerInfo
        toast.success(`${joinedPlayer.username} joined the game`)
        break
      }

      case OpCode.PLAYER_LEFT: {
        const playerLeftData = data as { username?: string; reason?: string }
        if (playerLeftData?.reason === 'disconnect') {
          toast('Opponent disconnected. Waiting for reconnect...')
        } else {
          toast.error(`${playerLeftData?.username || 'A player'} left the game`)
        }
        break
      }

      case OpCode.WAITING:
        toast('Waiting for opponent...')
        break

      case OpCode.ERROR: {
        const errorData = data as { code: number; message: string }
        toast.error(errorData.message)
        break
      }

      case OpCode.VOICE_SIGNAL:
        setVoiceSignal(data as VoiceSignalMessage)
        break

      default:
        logger.debug({ opCode: opCode, data: data }, 'Unhandled message')
    }
  }, [setGameState, setVoiceSignal])

  // ── Matchmaker Listener ───────────────────────────────────────────────────
  const onMatchmakerMatched = useCallback((callback: (matchId: string) => void) => {
    nakamaService.onMatchmakerMatched(callback)
  }, [])

  // ── Setup Message Handler ─────────────────────────────────────────────────
  useEffect(() => {
    nakamaService.setMessageHandler(messageHandler)
    nakamaService.setConnectionHandler(setConnected)
    return () => {
      nakamaService.removeMessageHandler()
      nakamaService.removeConnectionHandler()
    }
  }, [messageHandler, setConnected])
  return {
    // Auth
    authenticate,
    updateUsername,
    logout: signOut,

    // Connection
    connect,
    disconnect,
    isConnected,

    // Matchmaking
    findMatch,
    cancelMatchmaking,
    createPrivateMatch,
    joinPrivateMatch,
    onMatchmakerMatched,

    // Match
    joinMatch,
    leaveMatch,
    makeMove,
    makeQuantumMove,
    requestRematch,
    sendVoiceSignal,
  }
}
