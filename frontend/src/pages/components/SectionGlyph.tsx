import IconChip, { type IconCode, type IconTone } from './IconChip'

interface SectionGlyphProps {
  code: string
  tone?: IconTone
}

export default function SectionGlyph({ code, tone = 'neutral' }: SectionGlyphProps) {
  return <IconChip code={code as IconCode} tone={tone} size="sm" />
}
