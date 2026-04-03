import { useEffect } from 'react'
import { useSettingsStore } from '../context/store'

const PREFS_KEY = 'lila.preferences.v1'

type PersistedPrefs = {
  theme: 'cyberpunk' | 'retro' | 'minimal'
  soundEnabled: boolean
  hapticsEnabled: boolean
  voiceEnabled: boolean
}

function readStoredPrefs(): PersistedPrefs | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(PREFS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PersistedPrefs
  } catch {
    return null
  }
}

export function usePreferences() {
  const {
    theme,
    soundEnabled,
    hapticsEnabled,
    voiceEnabled,
    setTheme,
    setSoundEnabled,
    setHapticsEnabled,
    setVoiceEnabled,
  } = useSettingsStore()

  useEffect(() => {
    const stored = readStoredPrefs()
    if (!stored) return
    setTheme(stored.theme)
    setSoundEnabled(stored.soundEnabled)
    setHapticsEnabled(stored.hapticsEnabled)
    setVoiceEnabled(stored.voiceEnabled)
  }, [setTheme, setSoundEnabled, setHapticsEnabled, setVoiceEnabled])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const payload: PersistedPrefs = {
      theme: theme,
      soundEnabled: soundEnabled,
      hapticsEnabled: hapticsEnabled,
      voiceEnabled: voiceEnabled,
    }
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(payload))
    document.documentElement.dataset.theme = theme
  }, [theme, soundEnabled, hapticsEnabled, voiceEnabled])

  return {
    theme,
    soundEnabled,
    hapticsEnabled,
    voiceEnabled,
    setTheme,
    setSoundEnabled,
    setHapticsEnabled,
    setVoiceEnabled,
  }
}
