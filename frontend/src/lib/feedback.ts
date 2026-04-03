import confetti from 'canvas-confetti'

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (!audioContext) {
    const Context = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Context) {
      return null
    }
    audioContext = new Context()
  }

  return audioContext
}

export function playUiTone(type: 'click' | 'success' | 'error', enabled: boolean): void {
  if (!enabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  if (type === 'click') {
    osc.frequency.value = 420
    gain.gain.value = 0.02
  } else if (type === 'success') {
    osc.frequency.value = 620
    gain.gain.value = 0.035
  } else {
    osc.frequency.value = 220
    gain.gain.value = 0.03
  }

  osc.type = 'triangle'
  osc.start()
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15)
  osc.stop(ctx.currentTime + 0.16)
}

export function triggerHaptic(pattern: number | number[], enabled: boolean): void {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return
  }
  navigator.vibrate(pattern)
}

export function celebrateWin(enabled: boolean): void {
  if (!enabled) return
  confetti({
    particleCount: 120,
    spread: 65,
    origin: { y: 0.65 },
  })
}
