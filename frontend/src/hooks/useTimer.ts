import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../context/store'

export function useTimer() {
  const { gameState } = useGameStore()
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  // eslint-disable-next-line prefer-const
  let intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Update timer when game state changes
  useEffect(() => {
    if (gameState?.turnDeadline && gameState.phase === 'playing') {
      const updateTimer = () => {
        const now = Date.now()
        const remaining = Math.max(0, gameState.turnDeadline! - now)
        setTimeLeft(Math.ceil(remaining / 1000))
      }

      // Update immediately
      updateTimer()

      // Update every second
      intervalRef.current = setInterval(updateTimer, 1000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } else {
      setTimeLeft(null)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [gameState?.turnDeadline, gameState?.phase])

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Check if time is running low
  const isLowTime = timeLeft !== null && timeLeft <= 10

  return {
    timeLeft,
    formattedTime: timeLeft !== null ? formatTime(timeLeft) : null,
    isLowTime,
  }
}
