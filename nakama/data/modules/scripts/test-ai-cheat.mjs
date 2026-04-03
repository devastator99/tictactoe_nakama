import assert from 'node:assert/strict'

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function evaluateBoard(board, aiSymbol, humanSymbol) {
  for (const line of WIN_LINES) {
    const a = line[0]
    const b = line[1]
    const c = line[2]
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      if (board[a] === aiSymbol) return 10
      if (board[a] === humanSymbol) return -10
    }
  }
  return 0
}

function minimax(board, depth, isMax, aiSymbol, humanSymbol) {
  const score = evaluateBoard(board, aiSymbol, humanSymbol)
  if (score === 10) return score - depth
  if (score === -10) return score + depth
  if (depth === 0 || board.indexOf(null) === -1) return 0

  if (isMax) {
    let best = -1000
    for (let i = 0; i < 9; i++) {
      if (board[i] !== null) continue
      board[i] = aiSymbol
      best = Math.max(best, minimax(board, depth - 1, false, aiSymbol, humanSymbol))
      board[i] = null
    }
    return best
  }

  let best = 1000
  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue
    board[i] = humanSymbol
    best = Math.min(best, minimax(board, depth - 1, true, aiSymbol, humanSymbol))
    board[i] = null
  }
  return best
}

function findBestMove(board, aiSymbol, humanSymbol, depth) {
  let best = -1000
  let bestMove = -1
  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue
    board[i] = aiSymbol
    const value = minimax(board, depth - 1, false, aiSymbol, humanSymbol)
    board[i] = null
    if (value > best) {
      best = value
      bestMove = i
    }
  }
  return bestMove
}

function applyTrustPenalty(record, amount) {
  const next = { ...record }
  next.score = Math.max(0, next.score - amount)
  next.flagged = next.score <= 40
  return next
}

function testAiWinningMove() {
  const board = ['X', 'X', null, 'O', 'O', null, null, null, null]
  const best = findBestMove(board, 'X', 'O', 9)
  assert.equal(best, 2, 'AI should take immediate winning move')
}

function testAiBlocksOpponent() {
  const board = ['O', 'O', null, null, 'X', null, 'X', null, null]
  const best = findBestMove(board, 'X', 'O', 9)
  assert.equal(best, 2, 'AI should block opponent winning threat')
}

function testShadowBanThreshold() {
  let trust = { score: 100, flagged: false }
  trust = applyTrustPenalty(trust, 30)
  assert.equal(trust.flagged, false, 'Trust should not be flagged above threshold')
  trust = applyTrustPenalty(trust, 31)
  assert.equal(trust.flagged, true, 'Trust should be flagged once score crosses threshold')
}

testAiWinningMove()
testAiBlocksOpponent()
testShadowBanThreshold()
console.log('AI + anti-cheat unit tests passed.')
