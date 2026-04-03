// =============================================================================
// Frontend Types — mirrors Nakama server types
// =============================================================================

export type CellValue  = "X" | "O" | null;
export type Board      = CellValue[];
export type GameMode   = "classic" | "timed" | "vs_ai_easy" | "vs_ai_medium" | "vs_ai_hard";
export type GamePhase  = "lobby" | "playing" | "game_over";

// ── Op Codes (must match server) ───────────────────────────────────────────
export enum OpCode {
  // Server → Client
  GAME_STATE    = 1,
  GAME_START    = 2,
  GAME_OVER     = 3,
  PLAYER_JOINED = 4,
  PLAYER_LEFT   = 5,
  WAITING       = 6,
  TIMER_UPDATE  = 7,
  VOICE_SIGNAL  = 8,
  ERROR         = 99,

  // Client → Server
  MAKE_MOVE       = 101,
  REQUEST_REMATCH = 102,
  MAKE_QUANTUM_MOVE = 103,
}

// ── Player ────────────────────────────────────────────────────────────────
export interface PlayerInfo {
  userId:    string;
  username:  string;
  symbol:    "X" | "O";
  sessionId: string;
  connected: boolean;
  disconnectDeadline: number | null;
}

// ── Game State ─────────────────────────────────────────────────────────────
export interface GameState {
  matchId:      string | null;
  board:        Board;
  currentTurn:  string;
  moveCount:    number;
  phase:        GamePhase;
  winner:       string | null;
  winLine:      number[] | null;
  players:      PlayerInfo[];
  turnDeadline: number | null;
  mode:         GameMode;
  startedAt:    number | null;
  turnStartedAt:number | null;
  moves:        ReplayMove[];
  rematchVotes?: Record<string, boolean>;
  aiMoveDeadline?: number | null;
  quantumUsed?: Record<string, boolean>;
  gameOverReason?: string | null;
}

export interface ReplayMove {
  moveNumber: number;
  userId: string;
  symbol: "X" | "O";
  positions: number[];
  type: "normal" | "quantum";
  timestamp: number;
}

export interface ReplayPlayer {
  userId: string;
  username: string;
  symbol: "X" | "O";
}

export interface ReplayRecord {
  matchId: string;
  mode: GameMode;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  winner: string | null;
  winLine: number[] | null;
  reason: string;
  players: ReplayPlayer[];
  moves: ReplayMove[];
}

export interface ActivityEvent {
  id: string;
  at: number;
  matchId: string;
  message: string;
  mode: GameMode;
  winner: string | null;
  durationMs: number;
}

export interface AnalyticsData {
  totalMatches: number;
  activeMatches: number;
  averageDurationMs: number;
  totalMoves: number;
  quantumMoves: number;
  suspiciousMoves: number;
  shadowBans: number;
  cellClicks: number[];
  topCells: { cell: number; clicks: number }[];
  modeCounts: Record<string, number>;
  updatedAt: number;
}

export interface VoiceSignalMessage {
  fromUserId: string;
  targetUserId?: string | null;
  signalType: "offer" | "answer" | "ice-candidate" | "mute-state";
  payload: unknown;
  at: number;
}

// ── Leaderboard ────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank:       number;
  userId:     string;
  username:   string;
  wins:       number;
  winStreak:  number;
  totalGames: number;
  elo?:       number;
}

export interface PlayerStats {
  wins:       number;
  losses:     number;
  draws:      number;
  winStreak:  number;
  bestStreak: number;
  totalGames: number;
  rating?:    number;
  elo?:       number;
}

// ── Match ──────────────────────────────────────────────────────────────────
export interface MatchInfo {
  matchId: string;
  code?:   string;
  mode:    GameMode;
}

// ── Auth State ─────────────────────────────────────────────────────────────
export interface AuthUser {
  userId:   string;
  username: string;
  token:    string;
}

// ── Error ──────────────────────────────────────────────────────────────────
export interface GameError {
  code:    number;
  message: string;
}
