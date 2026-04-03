interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function BrandMark({ size = 'md', className = '' }: BrandMarkProps) {
  return (
    <div className={`brand-mark brand-mark--${size} ${className}`.trim()}>
      <span className="brand-x">X</span>
      <span className="brand-o">O</span>
    </div>
  )
}
