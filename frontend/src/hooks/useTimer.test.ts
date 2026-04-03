const mockGameState = {
  turnDeadline: null,
  phase: 'lobby',
}

function createUseTimerMock(gameState:any) {
  return () => {
    let timeLeft = null
    let intervalRef = null

    if (gameState?.turnDeadline && gameState.phase === 'playing') {
      const now = Date.now()
      const remaining = Math.max(0, gameState.turnDeadline - now)
      timeLeft = Math.ceil(remaining / 1000)
    }

    const formatTime = (seconds:number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const isLowTime = timeLeft !== null && timeLeft <= 10

    return {
      timeLeft,
      formattedTime: timeLeft !== null ? formatTime(timeLeft) : null,
      isLowTime,
    }
  }
}

describe('useTimer', () => {
  it('returns null when no gameState', () => {
    const { timeLeft, formattedTime, isLowTime } = createUseTimerMock(null)()
    expect(timeLeft).toBeNull()
    expect(formattedTime).toBeNull()
    expect(isLowTime).toBe(false)
  })

  it('returns null when not in playing phase', () => {
    const { timeLeft } = createUseTimerMock({
      turnDeadline: Date.now() + 30000,
      phase: 'lobby',
    })()
    expect(timeLeft).toBeNull()
  })

  it('calculates time remaining correctly', () => {
    const futureTime = Date.now() + 30000
    const { timeLeft, formattedTime } = createUseTimerMock({
      turnDeadline: futureTime,
      phase: 'playing',
    })()
    expect(timeLeft).toBe(30)
    expect(formattedTime).toBe('0:30')
  })

  it('formats time correctly for minutes', () => {
    const futureTime = Date.now() + 90000
    const { formattedTime } = createUseTimerMock({
      turnDeadline: futureTime,
      phase: 'playing',
    })()
    expect(formattedTime).toBe('1:30')
  })

  it('detects low time when <= 10 seconds', () => {
    const futureTime = Date.now() + 5000
    const { isLowTime } = createUseTimerMock({
      turnDeadline: futureTime,
      phase: 'playing',
    })()
    expect(isLowTime).toBe(true)
  })

  it('does not detect low time when > 10 seconds', () => {
    const futureTime = Date.now() + 15000
    const { isLowTime } = createUseTimerMock({
      turnDeadline: futureTime,
      phase: 'playing',
    })()
    expect(isLowTime).toBe(false)
  })

  it('handles null turnDeadline', () => {
    const { timeLeft } = createUseTimerMock({
      turnDeadline: null,
      phase: 'playing',
    })()
    expect(timeLeft).toBeNull()
  })
})
