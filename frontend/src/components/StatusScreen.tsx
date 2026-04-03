import BrandMark from './BrandMark'

interface StatusScreenProps {
  title: string
  message: string
  isLoading?: boolean
  primaryActionLabel?: string
  onPrimaryAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

export default function StatusScreen({
  title,
  message,
  isLoading = false,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: StatusScreenProps) {
  return (
    <div className="app-stage min-h-screen px-4 py-8">
      <div className="stage-shell flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        <div className="premium-card w-full max-w-xl p-8 text-center md:p-10">
          <BrandMark size="sm" className="mb-5 justify-center" />

          {isLoading && (
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-[3px] border-[rgba(74,141,255,0.2)] border-t-[var(--x)]" />
          )}

          <h1 className="mb-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.04em] text-[var(--ink)]">
            {title}
          </h1>
          <p className="mx-auto mb-8 max-w-md text-base leading-7 text-[var(--ink-soft)]">
            {message}
          </p>

          {(primaryActionLabel || secondaryActionLabel) && (
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {primaryActionLabel && onPrimaryAction && (
                <button onClick={onPrimaryAction} className="premium-btn premium-btn-primary">
                  {primaryActionLabel}
                </button>
              )}

              {secondaryActionLabel && onSecondaryAction && (
                <button onClick={onSecondaryAction} className="premium-btn premium-btn-secondary">
                  {secondaryActionLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
