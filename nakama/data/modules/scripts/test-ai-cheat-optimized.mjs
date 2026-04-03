import assert from 'node:assert/strict';

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

// Optimized board evaluation with early exit
function evaluateBoard(board, aiSymbol, humanSymbol) {
  for (let i = 0; i < WIN_LINES.length; i++) {
    const [a, b, c] = WIN_LINES[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      if (board[a] === aiSymbol) return 10;
      if (board[a] === humanSymbol) return -10;
    }
  }
  return 0;
}

// Optimized minimax with memoization
const memoCache = new Map();

function getBoardKey(board, depth, isMax, aiSymbol, humanSymbol) {
  return `${board.join(',')}_${depth}_${isMax}_${aiSymbol}_${humanSymbol}`;
}

function minimax(board, depth, isMax, aiSymbol, humanSymbol) {
  const key = getBoardKey(board, depth, isMax, aiSymbol, humanSymbol);
  if (memoCache.has(key)) {
    return memoCache.get(key);
  }

  const score = evaluateBoard(board, aiSymbol, humanSymbol);
  if (score === 10) return score - depth;
  if (score === -10) return score + depth;

  // Check for draw - no more null cells
  let hasEmptyCell = false;
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      hasEmptyCell = true;
      break;
    }
  }
  if (depth === 0 || !hasEmptyCell) return 0;

  let best = isMax ? -1000 : 1000;

  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue;
    board[i] = isMax ? aiSymbol : humanSymbol;
    const value = minimax(board, depth - 1, !isMax, aiSymbol, humanSymbol);
    board[i] = null;
    best = isMax ? Math.max(best, value) : Math.min(best, value);
  }

  memoCache.set(key, best);
  if (memoCache.size > 10000) {
    const keys = Array.from(memoCache.keys());
    for (let i = 0; i < 5000; i++) {
      memoCache.delete(keys[i]);
    }
  }

  return best;
}

function findBestMove(board, aiSymbol, humanSymbol, depth) {
  let best = -1000;
  let bestMove = -1;

  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue;
    board[i] = aiSymbol;
    const value = minimax(board, depth - 1, false, aiSymbol, humanSymbol);
    board[i] = null;
    if (value > best) {
      best = value;
      bestMove = i;
    }
  }

  return bestMove;
}

function applyTrustPenalty(record, amount) {
  const next = { ...record };
  next.score = Math.max(0, next.score - amount);
  next.flagged = next.score <= 40;
  return next;
}

// Tests
function testAiWinningMove() {
  const board = ['X', 'X', null, 'O', 'O', null, null, null, null];
  const best = findBestMove(board, 'X', 'O', 9);
  assert.equal(best, 2, 'AI should take immediate winning move');
}

function testAiBlocksOpponent() {
  const board = ['O', 'O', null, null, 'X', null, 'X', null, null];
  const best = findBestMove(board, 'X', 'O', 9);
  assert.equal(best, 2, 'AI should block opponent winning threat');
}

function testAiTakesOptimalFirstMove() {
  const board = [null, null, null, null, null, null, null, null, null];
  const best = findBestMove(board, 'X', 'O', 9);
  // Optimal first moves are corners (0,2,6,8) or center (4)
  const optimalFirstMoves = [0, 2, 4, 6, 8];
  assert.ok(optimalFirstMoves.includes(best), `AI should take optimal first move (got ${best})`);
}

function testShadowBanThreshold() {
  let trust = { score: 100, flagged: false };
  trust = applyTrustPenalty(trust, 30);
  assert.equal(trust.flagged, false, 'Trust should not be flagged above threshold');
  trust = applyTrustPenalty(trust, 31);
  assert.equal(trust.flagged, true, 'Trust should be flagged once score crosses threshold');
}

function testPerformanceBenchmark() {
  const iterations = 100;
  const board = [null, null, null, null, null, null, null, null, null];

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    memoCache.clear();
    findBestMove(board, 'X', 'O', 9);
  }
  const elapsed = performance.now() - start;
  const avgMs = elapsed / iterations;

  console.log(`Performance: ${avgMs.toFixed(2)}ms avg per decision (${iterations} iterations)`);
  assert.ok(avgMs < 100, 'AI decision should be under 100ms on average');
}

// Run tests
testAiWinningMove();
testAiBlocksOpponent();
testAiTakesOptimalFirstMove();
testShadowBanThreshold();
testPerformanceBenchmark();
console.log('AI + anti-cheat unit tests passed.');