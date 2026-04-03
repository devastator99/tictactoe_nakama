import { SectionHeader } from '../../components/WebUI'

interface SettingRow {
  key: string
  label: string
}

interface LobbySessionSettingsProps {
  theme: 'cyberpunk' | 'retro' | 'minimal'
  onThemeChange: (value: 'cyberpunk' | 'retro' | 'minimal') => void
  soundEnabled: boolean
  onSoundChange: (value: boolean) => void
  hapticsEnabled: boolean
  onHapticsChange: (value: boolean) => void
  voiceEnabled: boolean
  onVoiceChange: (value: boolean) => void
}

const THEME_OPTIONS: Array<{ value: 'cyberpunk' | 'retro' | 'minimal'; label: string }> = [
  { value: 'cyberpunk', label: 'Midnight' },
  { value: 'retro', label: 'Sand' },
  { value: 'minimal', label: 'Cloud' },
]

const SETTING_ROWS: SettingRow[] = [
  { label: 'Sound effects', key: 'sound' },
  { label: 'Haptic feedback', key: 'haptics' },
  { label: 'Voice chat', key: 'voice' },
]

export default function LobbySessionSettings({
  theme,
  onThemeChange,
  soundEnabled,
  onSoundChange,
  hapticsEnabled,
  onHapticsChange,
  voiceEnabled,
  onVoiceChange,
}: LobbySessionSettingsProps) {
  const handleSettingToggle = (key: string, currentValue: boolean) => {
    if (key === 'sound') onSoundChange(!currentValue)
    else if (key === 'haptics') onHapticsChange(!currentValue)
    else if (key === 'voice') onVoiceChange(!currentValue)
  }

  return (
    <section className="premium-card-muted p-6">
      <SectionHeader
        eyebrow="Session settings"
        title="Tune the feel"
        subtitle="Keep these local so the board still feels like yours each time you return."
      />

      <div className="space-y-4">
        <div>
          <label className="mb-3 block text-sm font-semibold text-[var(--ink-soft)]">Board tone</label>
          <div className="grid gap-3 sm:grid-cols-3">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onThemeChange(option.value)}
                className={`premium-segment justify-center ${theme === option.value ? 'is-selected' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="premium-list">
          {SETTING_ROWS.map((item) => {
            const values = {
              sound: soundEnabled,
              haptics: hapticsEnabled,
              voice: voiceEnabled,
            }
            const currentValue = values[item.key as keyof typeof values]

            return (
              <div key={item.key} className="premium-list-item flex items-center justify-between gap-4">
                <span className="font-semibold text-[var(--ink)]">{item.label}</span>
                <button
                  onClick={() => handleSettingToggle(item.key, currentValue)}
                  className={`premium-toggle ${currentValue ? 'is-on' : ''}`}
                >
                  {currentValue ? 'On' : 'Off'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
