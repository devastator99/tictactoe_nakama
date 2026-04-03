import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CellValue } from '../types'

interface GameBoardProps {
  board: CellValue[]
  onCellClick: (position: number) => void
  disabled: boolean
  winLine?: number[] | null
  selectedCells?: number[]
  highlightPlayable?: boolean
  lastMoveCells?: number[]
}

function renderSymbol(value: CellValue, showPlaceholder: boolean) {
  if (value === 'X') {
    return <span className="symbol-x font-[var(--font-display)] font-bold tracking-[-0.08em]">X</span>
  }

  if (value === 'O') {
    return <span className="symbol-o font-[var(--font-display)] font-bold tracking-[-0.08em]">O</span>
  }

  if (!showPlaceholder) {
    return <span aria-hidden className="board-placeholder board-placeholder-hidden">+</span>
  }

  return <span className="board-placeholder">+</span>
}

function buildCellLabel(index: number, value: CellValue, isWinning: boolean, isSelected: boolean, isLastMove: boolean) {
  const parts = [`Cell ${index + 1}`]

  if (value === null) {
    parts.push('empty')
  } else {
    parts.push(`marked ${value}`)
  }

  if (isWinning) {
    parts.push('winning line')
  }

  if (isSelected) {
    parts.push('selected for quantum move')
  }

  if (isLastMove) {
    parts.push('part of the latest move')
  }

  return parts.join(', ')
}

function GameBoardInner({
  board,
  onCellClick,
  disabled,
  winLine,
  selectedCells = [],
  highlightPlayable = false,
  lastMoveCells = [],
}: GameBoardProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="premium-card flex items-center justify-center p-4 sm:p-6">
      <div className="grid grid-cols-3 gap-3 sm:gap-4" role="grid" aria-label="Tic-tac-toe board">
        {board.map((cell, index) => {
          const isWinning = winLine?.includes(index)
          const isSelected = selectedCells.includes(index)
          const isLastMove = lastMoveCells.includes(index)
          const isDisabled = disabled || cell !== null
          const isPlayable = !isDisabled && highlightPlayable
          const baseSize = 'clamp(4.2rem, 22vw, 7rem)'
          const symbolSize = cell ? 'clamp(2.35rem, 10vw, 3.4rem)' : 'clamp(1.2rem, 5vw, 1.8rem)'

          return (
            <motion.button
              key={index}
              type="button"
              className={[
                'flex items-center justify-center rounded-[24px] border text-center shadow-[0_14px_30px_rgba(27,43,56,0.08)] transition-all duration-200 sm:rounded-[28px]',
                cell
                  ? 'border-[rgba(107,122,140,0.14)] bg-[rgba(255,255,255,0.78)]'
                  : isPlayable
                  ? 'board-cell-empty board-cell-empty--active focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(74,141,255,0.18)]'
                  : 'board-cell-empty board-cell-empty--idle',
                isWinning ? 'border-[rgba(51,179,124,0.28)] bg-[rgba(51,179,124,0.10)]' : '',
                isSelected ? 'border-[rgba(255,154,61,0.35)] bg-[rgba(255,154,61,0.12)] ring-2 ring-[rgba(255,154,61,0.2)]' : '',
                isLastMove && !isWinning && !isSelected ? 'board-cell-last-move' : '',
                disabled && !cell ? 'cursor-not-allowed opacity-70' : '',
              ].join(' ')}
              style={{ width: baseSize, height: baseSize }}
              onClick={() => !isDisabled && onCellClick(index)}
              whileHover={isPlayable && !shouldReduceMotion ? { scale: 1.02, y: -2 } : {}}
              whileTap={isPlayable && !shouldReduceMotion ? { scale: 0.97 } : {}}
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.88 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={shouldReduceMotion ? undefined : { delay: index * 0.04, duration: 0.18 }}
              role="gridcell"
              aria-label={buildCellLabel(index, cell, Boolean(isWinning), isSelected, isLastMove)}
              aria-disabled={isDisabled}
              aria-pressed={isSelected}
              disabled={isDisabled}
            >
              <span style={{ fontSize: symbolSize, lineHeight: 1 }}>{renderSymbol(cell, isPlayable)}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default memo(GameBoardInner)
