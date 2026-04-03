// =============================================================================
// runtime.ts — Single-file Nakama JavaScript runtime entry point.
// This is compiled as a plain script so Nakama can discover InitModule and
// registered match callbacks without any module-loader wrappers.
// =============================================================================

type Context = any;
type Logger = any;
type Nakama = any;
type Initializer = any;
type Dispatcher = any;
type Presence = any;
type Rpc = (ctx: Context, logger: Logger, nk: Nakama, payload: string) => string;

type CellValue = "X" | "O" | null;
type Board = CellValue[];
type GameMode = "classic" | "timed" | "vs_ai_easy" | "vs_ai_medium" | "vs_ai_hard";
type GamePhase = "lobby" | "playing" | "game_over";

enum OpCode {
  GAME_STATE = 1,
  GAME_START = 2,
  GAME_OVER = 3,
  PLAYER_JOINED = 4,
  PLAYER_LEFT = 5,
  WAITING = 6,
  TIMER_UPDATE = 7,
  VOICE_SIGNAL = 8,
  ERROR = 99,
  MAKE_MOVE = 101,
  REQUEST_REMATCH = 102,
  MAKE_QUANTUM_MOVE = 103,
}

interface PlayerInfo {
  userId: string;
  username: string;
  symbol: "X" | "O";
  sessionId: string;
  connected: boolean;
  disconnectDeadline: number | null;
}

interface GameState {
  matchId: string | null;
  board: Board;
  currentTurn: string;
  moveCount: number;
  phase: GamePhase;
  winner: string | null;
  winLine: number[] | null;
  players: PlayerInfo[];
  turnDeadline: number | null;
  mode: GameMode;
  startedAt: number | null;
  turnStartedAt: number | null;
  moves: ReplayMove[];
  rematchVotes?: Record<string, boolean>;
  aiMoveDeadline?: number | null;
  quantumUsed?: Record<string, boolean>;
  gameOverReason?: string | null;
}

interface ReplayMove {
  moveNumber: number;
  userId: string;
  symbol: "X" | "O";
  positions: number[];
  type: "normal" | "quantum";
  timestamp: number;
}

interface ReplayPlayer {
  userId: string;
  username: string;
  symbol: "X" | "O";
}

interface ReplayRecord {
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

interface ActivityEvent {
  id: string;
  at: number;
  matchId: string;
  message: string;
  mode: GameMode;
  winner: string | null;
  durationMs: number;
}

interface AnalyticsSnapshot {
  totalMatches: number;
  activeMatches: number;
  totalDurationMs: number;
  totalMoves: number;
  quantumMoves: number;
  suspiciousMoves: number;
  shadowBans: number;
  cellClicks: number[];
  modeCounts: { [key: string]: number };
  updatedAt: number;
}

interface TrustRecord {
  score: number;
  flagged: boolean;
  offenses: number;
  reasons: { reason: string; at: number }[];
  updatedAt: number;
}

interface RuntimeMatchState {
  gameState: GameState;
  tick: number;
}

interface MatchInfo {
  matchId: string;
  code?: string;
  mode: GameMode;
}

interface MatchmakerEntry {
  properties?: {
    mode?: GameMode;
    [key: string]: unknown;
  };
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  wins: number;
  winStreak: number;
  totalGames: number;
}

interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestStreak: number;
  totalGames: number;
}

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const TURN_TIMEOUT_SECONDS = 30;
const RECONNECT_GRACE_SECONDS = 20;
const RAPID_MOVE_THRESHOLD_MS = 50;
const TRUST_DEFAULT_SCORE = 100;
const TRUST_SHADOWBAN_THRESHOLD = 40;
const MAX_ACTIVITY_EVENTS = 40;
const MAX_REPLAY_INDEX_ITEMS = 30;

function buildMatchmakerQuery(mode: GameMode): string {
  return `+properties.mode:${mode}`;
}

function isValidGameMode(mode: string): mode is GameMode {
  return mode === "classic"
    || mode === "timed"
    || mode === "vs_ai_easy"
    || mode === "vs_ai_medium"
    || mode === "vs_ai_hard";
}

function createAnalyticsSnapshot(): AnalyticsSnapshot {
  return {
    totalMatches: 0,
    activeMatches: 0,
    totalDurationMs: 0,
    totalMoves: 0,
    quantumMoves: 0,
    suspiciousMoves: 0,
    shadowBans: 0,
    cellClicks: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    modeCounts: {},
    updatedAt: Date.now(),
  };
}

function applyStoredAnalytics(snapshot: AnalyticsSnapshot, stored: any): void {
  if (!stored || typeof stored !== "object") {
    return;
  }

  if (typeof stored.totalMatches === "number") snapshot.totalMatches = stored.totalMatches;
  if (typeof stored.activeMatches === "number") snapshot.activeMatches = stored.activeMatches;
  if (typeof stored.totalDurationMs === "number") snapshot.totalDurationMs = stored.totalDurationMs;
  if (typeof stored.totalMoves === "number") snapshot.totalMoves = stored.totalMoves;
  if (typeof stored.quantumMoves === "number") snapshot.quantumMoves = stored.quantumMoves;
  if (typeof stored.suspiciousMoves === "number") snapshot.suspiciousMoves = stored.suspiciousMoves;
  if (typeof stored.shadowBans === "number") snapshot.shadowBans = stored.shadowBans;
  if (Array.isArray(stored.cellClicks) && stored.cellClicks.length === 9) {
    snapshot.cellClicks = stored.cellClicks as number[];
  }
  if (stored.modeCounts && typeof stored.modeCounts === "object") {
    snapshot.modeCounts = stored.modeCounts as { [key: string]: number };
  }
  if (typeof stored.updatedAt === "number") snapshot.updatedAt = stored.updatedAt;
}

function readAnalytics(nk: Nakama): AnalyticsSnapshot {
  const snapshot = createAnalyticsSnapshot();
  const records = nk.storageRead([
    {
      collection: "analytics",
      key: "global",
    },
  ]);

  if (records.length > 0) {
    applyStoredAnalytics(snapshot, records[0].value);
  }

  return snapshot;
}

function writeAnalytics(nk: Nakama, snapshot: AnalyticsSnapshot): void {
  snapshot.updatedAt = Date.now();
  nk.storageWrite([
    {
      collection: "analytics",
      key: "global",
      permissionRead: 2,
      permissionWrite: 0,
      value: snapshot,
    },
  ]);
}

function mutateAnalytics(nk: Nakama, mutator: (snapshot: AnalyticsSnapshot) => void, logger: Logger): void {
  try {
    const snapshot = readAnalytics(nk);
    mutator(snapshot);
    writeAnalytics(nk, snapshot);
  } catch (error) {
    logger.error("Failed to mutate analytics: %s", error);
  }
}

function readActivityFeed(nk: Nakama): ActivityEvent[] {
  const records = nk.storageRead([
    {
      collection: "activity",
      key: "feed",
    },
  ]);

  if (records.length === 0) {
    return [];
  }

  const stored = records[0].value as { events?: ActivityEvent[] };
  if (!stored || !Array.isArray(stored.events)) {
    return [];
  }

  return stored.events;
}

function writeActivityFeed(nk: Nakama, events: ActivityEvent[]): void {
  nk.storageWrite([
    {
      collection: "activity",
      key: "feed",
      permissionRead: 2,
      permissionWrite: 0,
      value: { events: events },
    },
  ]);
}

function addActivityEvent(nk: Nakama, event: ActivityEvent, logger: Logger): void {
  try {
    const current = readActivityFeed(nk);
    current.unshift(event);
    if (current.length > MAX_ACTIVITY_EVENTS) {
      current.splice(MAX_ACTIVITY_EVENTS);
    }
    writeActivityFeed(nk, current);
  } catch (error) {
    logger.error("Failed to add activity event: %s", error);
  }
}

function createDefaultTrustRecord(): TrustRecord {
  return {
    score: TRUST_DEFAULT_SCORE,
    flagged: false,
    offenses: 0,
    reasons: [],
    updatedAt: Date.now(),
  };
}

function readTrustRecord(nk: Nakama, userId: string): TrustRecord {
  const trust = createDefaultTrustRecord();
  const records = nk.storageRead([
    {
      collection: "trust",
      key: userId,
      userId: userId,
    },
  ]);

  if (records.length > 0) {
    const value = records[0].value as Partial<TrustRecord>;
    if (typeof value.score === "number") trust.score = value.score;
    if (typeof value.flagged === "boolean") trust.flagged = value.flagged;
    if (typeof value.offenses === "number") trust.offenses = value.offenses;
    if (Array.isArray(value.reasons)) trust.reasons = value.reasons as { reason: string; at: number }[];
    if (typeof value.updatedAt === "number") trust.updatedAt = value.updatedAt;
  }

  return trust;
}

function writeTrustRecord(nk: Nakama, userId: string, trust: TrustRecord): void {
  trust.updatedAt = Date.now();
  nk.storageWrite([
    {
      collection: "trust",
      key: userId,
      userId: userId,
      permissionRead: 0,
      permissionWrite: 0,
      value: trust,
    },
  ]);
}

function isShadowBanned(nk: Nakama, userId: string): boolean {
  if (!userId || userId === "ai_bot") {
    return false;
  }
  const trust = readTrustRecord(nk, userId);
  return trust.flagged;
}

function applyTrustPenalty(
  nk: Nakama,
  userId: string,
  reason: string,
  amount: number,
  logger: Logger,
): void {
  if (!userId || userId === "ai_bot") {
    return;
  }

  try {
    const trust = readTrustRecord(nk, userId);
    const previouslyFlagged = trust.flagged;
    trust.score = Math.max(0, trust.score - amount);
    trust.offenses++;
    trust.reasons.unshift({ reason: reason, at: Date.now() });
    if (trust.reasons.length > 20) {
      trust.reasons.splice(20);
    }
    trust.flagged = trust.score <= TRUST_SHADOWBAN_THRESHOLD;
    writeTrustRecord(nk, userId, trust);

    mutateAnalytics(nk, (snapshot) => {
      snapshot.suspiciousMoves += 1;
      if (!previouslyFlagged && trust.flagged) {
        snapshot.shadowBans += 1;
      }
    }, logger);

    if (!previouslyFlagged && trust.flagged) {
      addActivityEvent(nk, {
        id: `event_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        at: Date.now(),
        matchId: "",
        message: "A high-risk account was shadow-banned after repeated suspicious moves.",
        mode: "classic",
        winner: null,
        durationMs: 0,
      }, logger);
    }
  } catch (error) {
    logger.error("Failed to apply trust penalty to %s: %s", userId, error);
  }
}

function recordMove(
  gameState: GameState,
  player: PlayerInfo,
  positions: number[],
  type: "normal" | "quantum",
): void {
  gameState.moves.push({
    moveNumber: gameState.moveCount,
    userId: player.userId,
    symbol: player.symbol,
    positions: positions,
    type: type,
    timestamp: Date.now(),
  });
}

function appendReplayIndex(nk: Nakama, userId: string, matchId: string): void {
  const records = nk.storageRead([
    {
      collection: "user_replays",
      key: userId,
      userId: userId,
    },
  ]);

  let matchIds: string[] = [];
  if (records.length > 0) {
    const value = records[0].value as { matchIds?: string[] };
    if (value && Array.isArray(value.matchIds)) {
      matchIds = value.matchIds;
    }
  }

  const deduped = [matchId].concat(matchIds.filter((id) => id !== matchId));
  if (deduped.length > MAX_REPLAY_INDEX_ITEMS) {
    deduped.splice(MAX_REPLAY_INDEX_ITEMS);
  }

  nk.storageWrite([
    {
      collection: "user_replays",
      key: userId,
      userId: userId,
      permissionRead: 0,
      permissionWrite: 0,
      value: { matchIds: deduped },
    },
  ]);
}

function persistReplay(nk: Nakama, gameState: GameState, reason: string, logger: Logger): void {
  if (!gameState.matchId || !gameState.startedAt) {
    return;
  }

  try {
    const endedAt = Date.now();
    const durationMs = Math.max(0, endedAt - gameState.startedAt);
    const replay: ReplayRecord = {
      matchId: gameState.matchId,
      mode: gameState.mode,
      startedAt: gameState.startedAt,
      endedAt: endedAt,
      durationMs: durationMs,
      winner: gameState.winner,
      winLine: gameState.winLine,
      reason: reason,
      players: gameState.players.map((player) => {
        return {
          userId: player.userId,
          username: player.username,
          symbol: player.symbol,
        };
      }),
      moves: gameState.moves,
    };

    nk.storageWrite([
      {
        collection: "replays",
        key: gameState.matchId,
        permissionRead: 2,
        permissionWrite: 0,
        value: replay,
      },
    ]);

    for (const player of gameState.players) {
      if (player.userId !== "ai_bot") {
        appendReplayIndex(nk, player.userId, gameState.matchId);
      }
    }
  } catch (error) {
    logger.error("Failed to persist replay for %s: %s", gameState.matchId, error);
  }
}

function trackMoveAnalytics(
  nk: Nakama,
  gameState: GameState,
  positions: number[],
  isQuantum: boolean,
  logger: Logger,
): void {
  mutateAnalytics(nk, (snapshot) => {
    snapshot.totalMoves += positions.length;
    if (isQuantum) {
      snapshot.quantumMoves += 1;
    }
    for (const position of positions) {
      if (position >= 0 && position < snapshot.cellClicks.length) {
        snapshot.cellClicks[position] += 1;
      }
    }
  }, logger);
}

function trackGameStartAnalytics(nk: Nakama, mode: GameMode, logger: Logger): void {
  mutateAnalytics(nk, (snapshot) => {
    snapshot.activeMatches += 1;
    snapshot.modeCounts[mode] = (snapshot.modeCounts[mode] || 0) + 1;
  }, logger);
}

function trackGameEndAnalytics(nk: Nakama, durationMs: number, logger: Logger): void {
  mutateAnalytics(nk, (snapshot) => {
    snapshot.totalMatches += 1;
    snapshot.totalDurationMs += durationMs;
    snapshot.activeMatches = Math.max(0, snapshot.activeMatches - 1);
  }, logger);
}

function readReplayByMatchId(nk: Nakama, matchId: string): ReplayRecord | null {
  const records = nk.storageRead([
    {
      collection: "replays",
      key: matchId,
    },
  ]);
  if (records.length === 0) {
    return null;
  }
  return records[0].value as ReplayRecord;
}

function readReplayListForUser(nk: Nakama, userId: string, limit: number): ReplayRecord[] {
  const indexRecords = nk.storageRead([
    {
      collection: "user_replays",
      key: userId,
      userId: userId,
    },
  ]);

  if (indexRecords.length === 0) {
    return [];
  }

  const indexValue = indexRecords[0].value as { matchIds?: string[] };
  if (!indexValue || !Array.isArray(indexValue.matchIds)) {
    return [];
  }

  const ids = indexValue.matchIds.slice(0, limit);
  const reads: Array<{ collection: string; key: string }> = [];
  for (const id of ids) {
    reads.push({
      collection: "replays",
      key: id,
    });
  }

  const replayRecords = nk.storageRead(reads);
  const replays: ReplayRecord[] = [];
  for (const record of replayRecords) {
    replays.push(record.value as ReplayRecord);
  }
  return replays;
}

function broadcastToMatch(dispatcher: Dispatcher, opCode: OpCode, payload: string): void {
  dispatcher.broadcastMessage(opCode, payload, null, null, true);
}

function sendToPresence(dispatcher: Dispatcher, opCode: OpCode, payload: string, presence: Presence): void {
  dispatcher.broadcastMessage(opCode, payload, [presence], null, true);
}

function parseMessagePayload(data: unknown): any {
  if (!data) {
    return {};
  }

  if (typeof data === "object") {
    const bufferLike = data as { byteLength?: number };
    if (typeof bufferLike.byteLength === "number") {
      const bytes = new Uint8Array(data as ArrayBuffer);
      let decodedFromBuffer = "";
      for (let i = 0; i < bytes.length; i++) {
        decodedFromBuffer += String.fromCharCode(bytes[i]);
      }
      return decodedFromBuffer ? JSON.parse(decodedFromBuffer) : {};
    }

    const byteArray = data as { length?: number; [index: number]: number };
    if (typeof byteArray.length !== "number") {
      return data as { [key: string]: unknown };
    }
  }

  let decoded = "";
  if (typeof data === "string") {
    decoded = data;
  } else {
    const byteArray = data as { length?: number; [index: number]: number };
    const byteLength = byteArray.length || 0;
    for (let i = 0; i < byteLength; i++) {
      decoded += String.fromCharCode(byteArray[i]);
    }
  }

  return decoded ? JSON.parse(decoded) as { [key: string]: unknown } : {};
}

class TicTacToeMatch {
  static create(
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    params: { [key: string]: unknown },
  ): { state: RuntimeMatchState; tickRate: number; label: string } {
    logger.info("Creating TicTacToe match with params: %o", params);

    const mode = (params.mode as GameMode) || "classic";
    const initialState: GameState = {
      matchId: null,
      board: Array(9).fill(null),
      currentTurn: "",
      moveCount: 0,
      phase: "lobby",
      winner: null,
      winLine: null,
      players: [],
      turnDeadline: null,
      mode: mode,
      startedAt: null,
      turnStartedAt: null,
      moves: [],
      gameOverReason: null,
    };

    return {
      state: {
        gameState: initialState,
        tick: 0,
      },
      tickRate: 1,
      label: `mode:${mode}`,
    };
  }

  static joinAttempt(
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    dispatcher: Dispatcher,
    tick: number,
    state: RuntimeMatchState,
    presence: Presence,
    metadata: { [key: string]: unknown },
  ): { state: RuntimeMatchState; accept: boolean; rejectMessage?: string } {
    const gameState = state.gameState;
    const existingPlayer = gameState.players.find((player) => player.userId === presence.userId);
    if (existingPlayer) {
      return { state: state, accept: true };
    }

    if (gameState.players.length >= 2) {
      return { state: state, accept: false, rejectMessage: "Match is full" };
    }

    logger.info("Player %s attempting to join", presence.userId);
    return { state: state, accept: true };
  }

  static join(
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    dispatcher: Dispatcher,
    tick: number,
    state: RuntimeMatchState,
    presences: Presence[],
  ): { state: RuntimeMatchState } {
    const gameState = state.gameState;
    if (!gameState.matchId && ctx && ctx.matchId) {
      gameState.matchId = ctx.matchId as string;
    }

    for (const presence of presences) {
      const account = nk.accountGetId(presence.userId);
      const username = account.user.username || `Player${gameState.players.length + 1}`;
      const existingPlayer = gameState.players.find((player) => player.userId === presence.userId);

      if (existingPlayer) {
        existingPlayer.username = username;
        existingPlayer.sessionId = presence.sessionId;
        existingPlayer.connected = true;
        existingPlayer.disconnectDeadline = null;

        broadcastToMatch(dispatcher, OpCode.PLAYER_JOINED, JSON.stringify(existingPlayer));
        logger.info("Player %s (%s) rejoined the match", username, presence.userId);
        continue;
      }

      const player: PlayerInfo = {
        userId: presence.userId,
        username: username,
        symbol: getAvailableSymbol(gameState.players),
        sessionId: presence.sessionId,
        connected: true,
        disconnectDeadline: null,
      };

      gameState.players.push(player);
      broadcastToMatch(dispatcher, OpCode.PLAYER_JOINED, JSON.stringify(player));
      logger.info("Player %s (%s) joined as %s", username, presence.userId, player.symbol);

      if (gameState.mode.startsWith("vs_ai_") && gameState.players.length === 1) {
        const aiDifficulty = gameState.mode.split("_")[2];
        const aiPlayer: PlayerInfo = {
          userId: "ai_bot",
          username: `AI (${aiDifficulty})`,
          symbol: getAvailableSymbol(gameState.players),
          sessionId: "ai_session",
          connected: true,
          disconnectDeadline: null,
        };
        gameState.players.push(aiPlayer);
        broadcastToMatch(dispatcher, OpCode.PLAYER_JOINED, JSON.stringify(aiPlayer));
        logger.info("AI Player joined as %s", aiPlayer.symbol);
      }
    }

    if (gameState.phase === "lobby" && hasTwoConnectedPlayers(gameState)) {
      resetMatchForStart(gameState);
      trackGameStartAnalytics(nk, gameState.mode, logger);
      broadcastToMatch(dispatcher, OpCode.GAME_START, JSON.stringify({ mode: gameState.mode }));
      logger.info("Game started between %s and %s", gameState.players[0].username, gameState.players[1].username);
    } else if (gameState.phase === "playing" && hasTwoConnectedPlayers(gameState) && gameState.mode === "timed" && !gameState.turnDeadline) {
      gameState.turnDeadline = Date.now() + (TURN_TIMEOUT_SECONDS * 1000);
    } else if (gameState.phase === "lobby") {
      broadcastToMatch(dispatcher, OpCode.WAITING, JSON.stringify({ players: gameState.players.length }));
    }

    broadcastToMatch(dispatcher, OpCode.GAME_STATE, JSON.stringify(gameState));
    return { state: state };
  }

  static leave(
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    dispatcher: Dispatcher,
    tick: number,
    state: RuntimeMatchState,
    presences: Presence[],
  ): { state: RuntimeMatchState } {
    const gameState = state.gameState;

    for (const presence of presences) {
      const playerIndex = gameState.players.findIndex((player) => player.userId === presence.userId);
      if (playerIndex === -1) {
        continue;
      }

      const player = gameState.players[playerIndex];
      if (gameState.phase === "lobby") {
        gameState.players.splice(playerIndex, 1);
        broadcastToMatch(
          dispatcher,
          OpCode.PLAYER_LEFT,
          JSON.stringify({ userId: presence.userId, username: player.username, reason: "left" }),
        );
        gameState.currentTurn = "";
        gameState.turnDeadline = null;
        gameState.rematchVotes = {};
      } else {
        player.connected = false;
        player.sessionId = "";
        player.disconnectDeadline = Date.now() + (RECONNECT_GRACE_SECONDS * 1000);
        gameState.turnDeadline = null;
        if (gameState.rematchVotes) {
          delete gameState.rematchVotes[player.userId];
        }

        broadcastToMatch(
          dispatcher,
          OpCode.PLAYER_LEFT,
          JSON.stringify({
            userId: presence.userId,
            username: player.username,
            reason: "disconnect",
            reconnectDeadline: player.disconnectDeadline,
          }),
        );
      }

      broadcastToMatch(dispatcher, OpCode.GAME_STATE, JSON.stringify(gameState));
      logger.info("Player %s left the match", player.username);
    }

    return { state: state };
  }

  static loop(
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    dispatcher: Dispatcher,
    tick: number,
    state: RuntimeMatchState,
    messages: any[],
  ): { state: RuntimeMatchState } {
    const gameState = state.gameState;
    if (!gameState.matchId && ctx && ctx.matchId) {
      gameState.matchId = ctx.matchId as string;
    }
    state.tick = tick;
    const now = Date.now();

    if (gameState.phase === "playing") {
      const disconnectedPlayer = gameState.players.find((player) =>
        !player.connected && player.disconnectDeadline !== null && now >= player.disconnectDeadline,
      );

      if (disconnectedPlayer) {
        const winner = gameState.players.find((player) => player.userId !== disconnectedPlayer.userId) || null;
        completeGame(
          gameState,
          dispatcher,
          nk,
          logger,
          winner ? winner.userId : null,
          winner ? "win" : "draw",
          { reason: "disconnect", forfeiter: disconnectedPlayer.username },
        );
        logger.info("Player %s forfeited after disconnect timeout", disconnectedPlayer.username);
        return { state: state };
      }
    }

    if (gameState.phase === "playing" && gameState.currentTurn === "ai_bot" && hasTwoConnectedPlayers(gameState)) {
      if (!gameState.aiMoveDeadline) {
        // Schedule AI move randomly between 500ms and 1500ms
        gameState.aiMoveDeadline = Date.now() + 500 + Math.floor(Math.random() * 1000);
      } else if (Date.now() >= gameState.aiMoveDeadline) {
        gameState.aiMoveDeadline = null;
        executeAiMove(gameState, dispatcher, nk, logger);
      }
    }

    if (gameState.mode === "timed" && gameState.phase === "playing" && gameState.turnDeadline && hasTwoConnectedPlayers(gameState)) {
      const timeLeft = Math.max(0, gameState.turnDeadline - now);
      if (tick % 5 === 0) {
        broadcastToMatch(dispatcher, OpCode.TIMER_UPDATE, JSON.stringify({ timeLeft: timeLeft }));
      }

      if (timeLeft <= 0) {
        const currentPlayer = gameState.players.find((player) => player.userId === gameState.currentTurn);
        if (currentPlayer) {
          const otherPlayer = gameState.players.find((player) => player.userId !== gameState.currentTurn) || null;
          completeGame(
            gameState,
            dispatcher,
            nk,
            logger,
            otherPlayer ? otherPlayer.userId : null,
            otherPlayer ? "win" : "draw",
            { reason: "timeout", forfeiter: currentPlayer.username },
          );
          logger.info("Player %s forfeited by timeout", currentPlayer.username);
        }
      }
    }

    for (const message of messages) {
      try {
        const opCode = message.opCode as OpCode;
        const data = parseMessagePayload(message.data);

        switch (opCode) {
          case OpCode.MAKE_MOVE:
            handleMakeMove(gameState, message.sender, data, dispatcher, nk, logger);
            break;
          case OpCode.MAKE_QUANTUM_MOVE:
            handleMakeQuantumMove(gameState, message.sender, data, dispatcher, nk, logger);
            break;
          case OpCode.VOICE_SIGNAL:
            handleVoiceSignal(gameState, message.sender, data, dispatcher, logger);
            break;
          case OpCode.REQUEST_REMATCH:
            handleRematchRequest(gameState, message.sender, dispatcher, nk, logger);
            break;
          default:
            logger.warn("Unknown opCode: %d", opCode);
        }
      } catch (error) {
        logger.error("Error processing message: " + error);
        broadcastToMatch(dispatcher, OpCode.ERROR, JSON.stringify({
          code: 400,
          message: "Invalid message format",
        }));
      }
    }

    return { state: state };
  }

  static terminate(
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    dispatcher: Dispatcher,
    tick: number,
    state: RuntimeMatchState,
    graceSeconds: number,
  ): { state: RuntimeMatchState } {
    logger.info("Terminating match in %d seconds", graceSeconds);
    return { state: state };
  }

  static signal(
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    dispatcher: Dispatcher,
    tick: number,
    state: RuntimeMatchState,
    data: string,
  ): { state: RuntimeMatchState; data?: string } {
    logger.info("Received match signal: %s", data);
    return { state: state, data: data };
  }
}

function handleMakeMove(
  gameState: GameState,
  sender: Presence,
  data: { position: number },
  dispatcher: Dispatcher,
  nk: Nakama,
  logger: Logger,
): void {
  if (!data || typeof data !== "object") {
    logger.warn("Rejected move from %s because payload is invalid", sender.userId);
    applyTrustPenalty(nk, sender.userId, "invalid_move_payload", 8, logger);
    sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 400, message: "Invalid payload" }), sender);
    return;
  }

  if (gameState.phase !== "playing") {
    logger.warn("Rejected move from %s because match phase is %s", sender.userId, gameState.phase);
    applyTrustPenalty(nk, sender.userId, "move_outside_playing_phase", 5, logger);
    sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 403, message: "Game is not in playing phase" }), sender);
    return;
  }

  if (!hasTwoConnectedPlayers(gameState)) {
    logger.warn("Rejected move from %s because both players are not connected", sender.userId);
    sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 409, message: "Game is paused while a player reconnects" }), sender);
    return;
  }

  if (gameState.currentTurn !== sender.userId) {
    logger.warn("Rejected move from %s because it is %s's turn", sender.userId, gameState.currentTurn);
    applyTrustPenalty(nk, sender.userId, "played_out_of_turn", 8, logger);
    sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 403, message: "Not your turn" }), sender);
    return;
  }

  if (gameState.turnStartedAt && Date.now() - gameState.turnStartedAt < RAPID_MOVE_THRESHOLD_MS) {
    applyTrustPenalty(nk, sender.userId, "rapid_move_under_50ms", 12, logger);
  }

  const position = data.position;
  if (typeof position !== "number" || !Number.isInteger(position) || position < 0 || position > 8) {
    logger.warn("Rejected move from %s because position %v is invalid", sender.userId, position);
    applyTrustPenalty(nk, sender.userId, "invalid_move_position", 8, logger);
    sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 400, message: "Invalid position" }), sender);
    return;
  }

  if (gameState.board[position] !== null) {
    logger.warn("Rejected move from %s because position %d is already occupied", sender.userId, position);
    applyTrustPenalty(nk, sender.userId, "move_on_occupied_cell", 6, logger);
    sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 409, message: "Cell is already occupied" }), sender);
    return;
  }

  const player = gameState.players.find((entry) => entry.userId === sender.userId);
  if (!player) {
    logger.warn("Rejected move from %s because player not found in match", sender.userId);
    applyTrustPenalty(nk, sender.userId, "player_not_found", 10, logger);
    sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 403, message: "Player not found in match" }), sender);
    return;
  }

  gameState.board[position] = player.symbol;
  gameState.moveCount++;
  recordMove(gameState, player, [position], "normal");
  trackMoveAnalytics(nk, gameState, [position], false, logger);

  const winLine = checkWin(gameState.board);
  if (winLine) {
    gameState.winLine = winLine;
    completeGame(gameState, dispatcher, nk, logger, sender.userId, "win", {
      reason: "win",
      winner: sender.userId,
    });
    logger.info("Player %s won the game", player.username);
  } else if (gameState.moveCount === 9) {
    completeGame(gameState, dispatcher, nk, logger, null, "draw", {
      reason: "draw",
    });
    logger.info("Game ended in a draw");
  } else {
    const nextPlayer = gameState.players.find((entry) => entry.userId !== sender.userId);
    if (nextPlayer) {
      gameState.currentTurn = nextPlayer.userId;
      gameState.turnStartedAt = Date.now();
      if (gameState.mode === "timed") {
        gameState.turnDeadline = Date.now() + (TURN_TIMEOUT_SECONDS * 1000);
      }
    }
  }

  broadcastToMatch(dispatcher, OpCode.GAME_STATE, JSON.stringify(gameState));
}

function handleRematchRequest(
  gameState: GameState,
  sender: Presence,
  dispatcher: Dispatcher,
  nk: Nakama,
  logger: Logger,
): void {
  if (gameState.phase !== "game_over") {
    return;
  }

  if (!gameState.rematchVotes) {
    gameState.rematchVotes = {};
  }

  const requestingPlayer = gameState.players.find((player) => player.userId === sender.userId);
  if (!requestingPlayer || !requestingPlayer.connected) {
    return;
  }

  gameState.rematchVotes[sender.userId] = true;

  if (Object.keys(gameState.rematchVotes).length === gameState.players.length) {
    for (const player of gameState.players) {
      player.symbol = player.symbol === "X" ? "O" : "X";
      player.disconnectDeadline = null;
    }

    resetMatchForStart(gameState);
    trackGameStartAnalytics(nk, gameState.mode, logger);
    broadcastToMatch(dispatcher, OpCode.GAME_START, JSON.stringify({ mode: gameState.mode, rematch: true }));
    broadcastToMatch(dispatcher, OpCode.GAME_STATE, JSON.stringify(gameState));
    logger.info("Rematch started with swapped symbols");
  } else {
    broadcastToMatch(dispatcher, OpCode.GAME_STATE, JSON.stringify(gameState));
  }
}

function handleVoiceSignal(
  gameState: GameState,
  sender: Presence,
  data: { signalType?: string; payload?: unknown; targetUserId?: string },
  dispatcher: Dispatcher,
  logger: Logger,
): void {
  const senderPlayer = gameState.players.find((player) => player.userId === sender.userId);
  if (!senderPlayer) {
    logger.warn("Rejected voice signal from unknown sender %s", sender.userId);
    return;
  }

  if (!data || typeof data !== "object" || typeof data.signalType !== "string") {
    logger.warn("Rejected malformed voice signal from %s", sender.userId);
    return;
  }

  const signalType = data.signalType;
  if (
    signalType !== "offer"
    && signalType !== "answer"
    && signalType !== "ice-candidate"
    && signalType !== "mute-state"
  ) {
    logger.warn("Rejected unsupported voice signal type %s from %s", signalType, sender.userId);
    return;
  }

  broadcastToMatch(dispatcher, OpCode.VOICE_SIGNAL, JSON.stringify({
    fromUserId: sender.userId,
    targetUserId: data.targetUserId || null,
    signalType: signalType,
    payload: data.payload || null,
    at: Date.now(),
  }));
}

function checkWin(board: Board): number[] | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }

  return null;
}

function getAvailableSymbol(players: PlayerInfo[]): "X" | "O" {
  return players.some((player) => player.symbol === "X") ? "O" : "X";
}

function hasTwoConnectedPlayers(gameState: GameState): boolean {
  return gameState.players.length === 2 && gameState.players.every((player) => player.connected);
}

function resetMatchForStart(gameState: GameState): void {
  gameState.board = Array(9).fill(null);
  gameState.currentTurn = gameState.players.find((player) => player.symbol === "X")?.userId || "";
  gameState.moveCount = 0;
  gameState.phase = "playing";
  gameState.winner = null;
  gameState.winLine = null;
  gameState.rematchVotes = {};
  gameState.quantumUsed = {};
  gameState.aiMoveDeadline = null;
  gameState.startedAt = Date.now();
  gameState.turnStartedAt = Date.now();
  gameState.moves = [];
  gameState.gameOverReason = null;
  gameState.turnDeadline = gameState.mode === "timed" ? Date.now() + (TURN_TIMEOUT_SECONDS * 1000) : null;
}

function completeGame(
  gameState: GameState,
  dispatcher: Dispatcher,
  nk: Nakama,
  logger: Logger,
  winnerUserId: string | null,
  result: "win" | "draw",
  payload: { [key: string]: unknown },
): void {
  gameState.phase = "game_over";
  gameState.winner = winnerUserId;
  gameState.turnDeadline = null;
  gameState.turnStartedAt = null;
  gameState.rematchVotes = {};
  gameState.gameOverReason = String(payload.reason || result);

  if (result === "draw") {
    for (const player of gameState.players) {
      if (player.userId !== "ai_bot") {
        updatePlayerStats(nk, player.userId, "draw", logger);
      }
    }
  } else if (winnerUserId) {
    if (winnerUserId !== "ai_bot") {
      updatePlayerStats(nk, winnerUserId, "win", logger);
    }
    const loser = gameState.players.find((player) => player.userId !== winnerUserId);
    if (loser && loser.userId !== "ai_bot") {
      updatePlayerStats(nk, loser.userId, "loss", logger);
    }
  }

  const gameOverPayload: { [key: string]: unknown } = {};
  for (const key in payload) {
    gameOverPayload[key] = payload[key];
  }
  gameOverPayload.winner = winnerUserId;

  const durationMs = gameState.startedAt ? Math.max(0, Date.now() - gameState.startedAt) : 0;
  persistReplay(nk, gameState, String(gameState.gameOverReason || result), logger);
  trackGameEndAnalytics(nk, durationMs, logger);
  if (gameState.matchId) {
    const winnerPlayer = winnerUserId
      ? gameState.players.find((player) => player.userId === winnerUserId)
      : null;
    const winnerName = winnerPlayer ? winnerPlayer.username : "AI";
    addActivityEvent(nk, {
      id: `event_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      at: Date.now(),
      matchId: gameState.matchId,
      message: winnerUserId
        ? `${winnerUserId === "ai_bot" ? "AI" : winnerName} won a ${gameState.mode} match in ${Math.round(durationMs / 1000)}s`
        : `A ${gameState.mode} match ended in a draw`,
      mode: gameState.mode,
      winner: winnerUserId,
      durationMs: durationMs,
    }, logger);
  }

  broadcastToMatch(dispatcher, OpCode.GAME_OVER, JSON.stringify(gameOverPayload));
  broadcastToMatch(dispatcher, OpCode.GAME_STATE, JSON.stringify(gameState));
}

function updatePlayerStats(
  nk: Nakama,
  userId: string,
  result: "win" | "loss" | "draw",
  logger: Logger,
): void {
  try {
    const stats = readPlayerStats(nk, userId);

    stats.totalGames++;
    if (result === "win") {
      stats.wins++;
      stats.winStreak++;
      stats.bestStreak = Math.max(stats.bestStreak, stats.winStreak);
    } else if (result === "loss") {
      stats.losses++;
      stats.winStreak = 0;
    } else {
      stats.draws++;
      stats.winStreak = 0;
    }

    nk.storageWrite([
      {
        collection: "stats",
        key: userId,
        userId: userId,
        value: stats,
      },
    ]);

    const account = nk.accountGetId(userId);
    const username = account.user.username || "";
    upsertLeaderboardEntry(nk, userId, username, stats);
  } catch (error) {
    logger.error("Failed to update player stats: %s", error);
  }
}

const findOrCreateMatch: Rpc = function (ctx, logger, nk, payload) {
  logger.info("RPC: findOrCreateMatch called by %s", ctx.userId);
  const body = JSON.parse(payload || "{}") as { mode?: string };
  const requestedMode = body.mode || "classic";
  const mode = isValidGameMode(requestedMode) ? requestedMode : "classic";

  if (isShadowBanned(nk, ctx.userId)) {
    const shadowMode: GameMode = "vs_ai_hard";
    const directMatchId = nk.matchCreate("tictactoe", { mode: shadowMode });
    return JSON.stringify({
      ticket: "",
      matchId: directMatchId,
      mode: shadowMode,
      direct: true,
      shadowBanned: true,
    });
  }

  if (mode.startsWith("vs_ai_")) {
    const directMatchId = nk.matchCreate("tictactoe", { mode: mode });
    return JSON.stringify({
      ticket: "",
      matchId: directMatchId,
      mode: mode,
      direct: true,
      shadowBanned: false,
    });
  }

  return JSON.stringify({
    ticket: "",
    mode: mode,
    direct: false,
    shadowBanned: false,
  });
};

const createPrivateMatch: Rpc = function (ctx, logger, nk, payload) {
  logger.info("RPC: createPrivateMatch called by %s", ctx.userId);
  const body = JSON.parse(payload || "{}") as { mode?: string };
  const requestedMode = body.mode || "classic";
  const mode = isValidGameMode(requestedMode) ? requestedMode : "classic";

  if (isShadowBanned(nk, ctx.userId) && !mode.startsWith("vs_ai_")) {
    throw new Error("Private multiplayer is unavailable for this account");
  }

  if (mode.startsWith("vs_ai_")) {
    const aiMatchId = nk.matchCreate("tictactoe", { mode: mode });
    const aiResult: MatchInfo = { matchId: aiMatchId, mode: mode };
    return JSON.stringify(aiResult);
  }

  const code = generateUniqueRoomCode(nk);
  const matchId = nk.matchCreate("tictactoe", { mode: mode, code: code });

  nk.storageWrite([
    {
      collection: "rooms",
      key: code,
      permissionRead: 0,
      permissionWrite: 0,
      value: { matchId: matchId, mode: mode, createdBy: ctx.userId, createdAt: Date.now() },
    },
  ]);

  const result: MatchInfo = { matchId: matchId, code: code, mode: mode };
  return JSON.stringify(result);
};

const joinPrivateMatch: Rpc = function (ctx, logger, nk, payload) {
  logger.info("RPC: joinPrivateMatch called by %s", ctx.userId);
  if (isShadowBanned(nk, ctx.userId)) {
    throw new Error("Private multiplayer is unavailable for this account");
  }

  const body = JSON.parse(payload || "{}") as { code?: string };
  const normalizedCode = body.code?.trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error("Room code is required");
  }

  const rooms = nk.storageRead([
    {
      collection: "rooms",
      key: normalizedCode,
    },
  ]);

  if (rooms.length === 0) {
    throw new Error("Room not found");
  }

  return JSON.stringify({ matchId: rooms[0].value.matchId });
};

const getLeaderboard: Rpc = function (ctx, logger, nk, payload) {
  logger.info("RPC: getLeaderboard called by %s", ctx.userId);
  const body = JSON.parse(payload || "{}") as { limit?: number };
  const safeLimit = Math.min(Math.max(body.limit || 20, 1), 100);
  const leaderboard = readLeaderboardEntries(nk).slice(0, safeLimit);

  return JSON.stringify(leaderboard);
};

const getPlayerStats: Rpc = function (ctx, logger, nk, payload) {
  logger.info("RPC: getPlayerStats called by %s", ctx.userId);
  const body = JSON.parse(payload || "{}") as { userId?: string };
  const userId = body.userId || ctx.userId;

  if (!userId) {
    throw new Error("User ID is required");
  }

  return JSON.stringify(readPlayerStats(nk, userId));
};

const getMatchReplay: Rpc = function (ctx, logger, nk, payload) {
  logger.info("RPC: getMatchReplay called by %s", ctx.userId);
  const body = JSON.parse(payload || "{}") as { matchId?: string; limit?: number };
  const safeLimit = Math.min(Math.max(body.limit || 10, 1), 30);

  if (body.matchId && body.matchId.trim()) {
    const replay = readReplayByMatchId(nk, body.matchId.trim());
    if (!replay) {
      throw new Error("Replay not found");
    }

    if (!replay.players.some((player) => player.userId === ctx.userId)) {
      throw new Error("Replay access denied");
    }

    return JSON.stringify({ replay: replay });
  }

  const recentReplays = readReplayListForUser(nk, ctx.userId, safeLimit);
  return JSON.stringify({ items: recentReplays });
};

const getAnalyticsRpc: Rpc = function (ctx, logger, nk, payload) {
  logger.info("RPC: getAnalytics called by %s", ctx.userId);
  const snapshot = readAnalytics(nk);
  const averageDurationMs = snapshot.totalMatches > 0
    ? Math.round(snapshot.totalDurationMs / snapshot.totalMatches)
    : 0;

  const topCells = snapshot.cellClicks
    .map((clicks, index) => ({ cell: index, clicks: clicks }))
    .sort((left, right) => right.clicks - left.clicks);

  return JSON.stringify({
    totalMatches: snapshot.totalMatches,
    activeMatches: snapshot.activeMatches,
    averageDurationMs: averageDurationMs,
    totalMoves: snapshot.totalMoves,
    quantumMoves: snapshot.quantumMoves,
    suspiciousMoves: snapshot.suspiciousMoves,
    shadowBans: snapshot.shadowBans,
    cellClicks: snapshot.cellClicks,
    topCells: topCells,
    modeCounts: snapshot.modeCounts,
    updatedAt: snapshot.updatedAt,
  });
};

const getLiveActivity: Rpc = function (ctx, logger, nk, payload) {
  logger.info("RPC: getLiveActivity called by %s", ctx.userId);
  const body = JSON.parse(payload || "{}") as { limit?: number };
  const safeLimit = Math.min(Math.max(body.limit || 20, 1), 40);
  const events = readActivityFeed(nk).slice(0, safeLimit);
  return JSON.stringify({ items: events });
};

const matchmakerMatched = function (
  ctx: Context,
  logger: Logger,
  nk: Nakama,
  entries: MatchmakerEntry[],
) {
  const requestedMode = entries.find((entry) => entry.properties?.mode)?.properties?.mode;
  const mode = requestedMode && isValidGameMode(requestedMode) ? requestedMode : "classic";
  const matchId = nk.matchCreate("tictactoe", { mode: mode });

  logger.info("Created quick match " + matchId + " in " + mode + " mode for " + entries.length + " entries");
  return matchId;
};

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateUniqueRoomCode(nk: Nakama): string {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateRoomCode();
    const existing = nk.storageRead([
      {
        collection: "rooms",
        key: code,
      },
    ]);
    if (existing.length === 0) {
      return code;
    }
  }
  throw new Error("Failed to generate a unique room code");
}

function readPlayerStats(nk: Nakama, userId: string): PlayerStats {
  const stats = createDefaultPlayerStats();
  const statsStorage = nk.storageRead([
    {
      collection: "stats",
      key: userId,
      userId: userId,
    },
  ]);

  if (statsStorage.length > 0) {
    applyStoredStats(stats, statsStorage[0].value as Partial<PlayerStats>);
  }

  return stats;
}

function readLeaderboardEntries(nk: Nakama): LeaderboardEntry[] {
  const leaderboardStorage = nk.storageRead([
    {
      collection: "leaderboard",
      key: "wins",
    },
  ]);

  if (leaderboardStorage.length === 0) {
    return [];
  }

  const storedValue = leaderboardStorage[0].value as { entries?: LeaderboardEntry[] };
  if (!storedValue.entries || !Array.isArray(storedValue.entries)) {
    return [];
  }

  return storedValue.entries;
}

function upsertLeaderboardEntry(
  nk: Nakama,
  userId: string,
  username: string,
  stats: PlayerStats,
): void {
  const leaderboardEntries = readLeaderboardEntries(nk);
  const existingEntry = leaderboardEntries.find((entry) => entry.userId === userId);

  if (existingEntry) {
    existingEntry.username = username;
    existingEntry.wins = stats.wins;
    existingEntry.winStreak = stats.winStreak;
    existingEntry.totalGames = stats.totalGames;
  } else {
    leaderboardEntries.push({
      rank: 0,
      userId: userId,
      username: username,
      wins: stats.wins,
      winStreak: stats.winStreak,
      totalGames: stats.totalGames,
    });
  }

  leaderboardEntries.sort((left, right) => {
    if (right.wins !== left.wins) {
      return right.wins - left.wins;
    }
    if (right.winStreak !== left.winStreak) {
      return right.winStreak - left.winStreak;
    }
    if (right.totalGames !== left.totalGames) {
      return right.totalGames - left.totalGames;
    }
    return left.username < right.username ? -1 : left.username > right.username ? 1 : 0;
  });

  for (let i = 0; i < leaderboardEntries.length; i++) {
    leaderboardEntries[i].rank = i + 1;
  }

  nk.storageWrite([
    {
      collection: "leaderboard",
      key: "wins",
      permissionRead: 0,
      permissionWrite: 0,
      value: {
        entries: leaderboardEntries.slice(0, 100),
        updatedAt: Date.now(),
      },
    },
  ]);
}

function createDefaultPlayerStats(): PlayerStats {
  return {
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    bestStreak: 0,
    totalGames: 0,
  };
}

function applyStoredStats(stats: PlayerStats, storedStats: Partial<PlayerStats>): void {
  if (typeof storedStats.wins === "number") {
    stats.wins = storedStats.wins;
  }
  if (typeof storedStats.losses === "number") {
    stats.losses = storedStats.losses;
  }
  if (typeof storedStats.draws === "number") {
    stats.draws = storedStats.draws;
  }
  if (typeof storedStats.winStreak === "number") {
    stats.winStreak = storedStats.winStreak;
  }
  if (typeof storedStats.bestStreak === "number") {
    stats.bestStreak = storedStats.bestStreak;
  }
  if (typeof storedStats.totalGames === "number") {
    stats.totalGames = storedStats.totalGames;
  }
}

const matchInit = function (ctx: Context, logger: Logger, nk: Nakama, params: { [key: string]: unknown }) {
  return TicTacToeMatch.create(ctx, logger, nk, params);
};

const matchJoinAttempt = function (
  ctx: Context,
  logger: Logger,
  nk: Nakama,
  dispatcher: Dispatcher,
  tick: number,
  state: RuntimeMatchState,
  presence: Presence,
  metadata: { [key: string]: unknown },
) {
  return TicTacToeMatch.joinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata);
};

const matchJoin = function (
  ctx: Context,
  logger: Logger,
  nk: Nakama,
  dispatcher: Dispatcher,
  tick: number,
  state: RuntimeMatchState,
  presences: Presence[],
) {
  return TicTacToeMatch.join(ctx, logger, nk, dispatcher, tick, state, presences);
};

const matchLeave = function (
  ctx: Context,
  logger: Logger,
  nk: Nakama,
  dispatcher: Dispatcher,
  tick: number,
  state: RuntimeMatchState,
  presences: Presence[],
) {
  return TicTacToeMatch.leave(ctx, logger, nk, dispatcher, tick, state, presences);
};

const matchLoop = function (
  ctx: Context,
  logger: Logger,
  nk: Nakama,
  dispatcher: Dispatcher,
  tick: number,
  state: RuntimeMatchState,
  messages: any[],
) {
  return TicTacToeMatch.loop(ctx, logger, nk, dispatcher, tick, state, messages);
};

const matchTerminate = function (
  ctx: Context,
  logger: Logger,
  nk: Nakama,
  dispatcher: Dispatcher,
  tick: number,
  state: RuntimeMatchState,
  graceSeconds: number,
) {
  return TicTacToeMatch.terminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds);
};

const matchSignal = function (
  ctx: Context,
  logger: Logger,
  nk: Nakama,
  dispatcher: Dispatcher,
  tick: number,
  state: RuntimeMatchState,
  data: string,
) {
  return TicTacToeMatch.signal(ctx, logger, nk, dispatcher, tick, state, data);
};

// AI LOGIC
function executeAiMove(gameState: GameState, dispatcher: Dispatcher, nk: Nakama, logger: Logger): void {
  const diff = gameState.mode.split("_")[2] || "easy";
  let movePos = -1;

  if (diff === "easy") {
    const available = [];
    for (let i = 0; i < 9; i++) {
        if (!gameState.board[i]) available.push(i);
    }
    if (available.length > 0) movePos = available[Math.floor(Math.random() * available.length)];
  } else if (diff === "medium") {
    movePos = findBestMove(gameState.board, "ai_bot", gameState.players, 1);
  } else if (diff === "hard") {
    movePos = findBestMove(gameState.board, "ai_bot", gameState.players, 9);
  }

  if (movePos !== -1) {
    const aiPlayer = gameState.players.find(p => p.userId === "ai_bot");
    if (!aiPlayer) return;
    
    gameState.board[movePos] = aiPlayer.symbol;
    gameState.moveCount++;
    recordMove(gameState, aiPlayer, [movePos], "normal");
    trackMoveAnalytics(nk, gameState, [movePos], false, logger);

    const winLine = checkWin(gameState.board);
    if (winLine) {
      gameState.winLine = winLine;
      completeGame(gameState, dispatcher, nk, logger, aiPlayer.userId, "win", {
        reason: "win",
        winner: aiPlayer.userId,
      });
      logger.info("Player %s won the game", aiPlayer.username);
    } else if (gameState.moveCount >= 9) {
      completeGame(gameState, dispatcher, nk, logger, null, "draw", {
        reason: "draw",
      });
      logger.info("Game ended in a draw");
    } else {
      const nextPlayer = gameState.players.find((entry) => entry.userId !== "ai_bot");
      if (nextPlayer) {
        gameState.currentTurn = nextPlayer.userId;
        gameState.turnStartedAt = Date.now();
        if (gameState.mode === "timed") {
          gameState.turnDeadline = Date.now() + (TURN_TIMEOUT_SECONDS * 1000);
        }
      }
    }
    broadcastToMatch(dispatcher, OpCode.GAME_STATE, JSON.stringify(gameState));
  }
}

function evaluateBoard(board: Board, aiSymbol: "X" | "O", humanSymbol: "X" | "O"): number {
  for (const line of WINNING_LINES) {
    const a = line[0] as number;
    const b = line[1] as number;
    const c = line[2] as number;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      if (board[a] === aiSymbol) return 10;
      else if (board[a] === humanSymbol) return -10;
    }
  }
  return 0;
}

function minimax(board: Board, depth: number, isMax: boolean, aiSymbol: "X" | "O", humanSymbol: "X" | "O"): number {
  const score = evaluateBoard(board, aiSymbol, humanSymbol);
  if (score === 10) return score - depth;
  if (score === -10) return score + depth;
  if (board.indexOf(null) === -1) return 0;
  if (depth === 0) return 0;

  if (isMax) {
    let best = -1000;
    for (let i = 0; i < 9; i++) {
        if (!board[i]) {
            board[i] = aiSymbol;
            best = Math.max(best, minimax(board, depth - 1, !isMax, aiSymbol, humanSymbol));
            board[i] = null;
        }
    }
    return best;
  } else {
    let best = 1000;
    for (let i = 0; i < 9; i++) {
        if (!board[i]) {
            board[i] = humanSymbol;
            best = Math.min(best, minimax(board, depth - 1, !isMax, aiSymbol, humanSymbol));
            board[i] = null;
        }
    }
    return best;
  }
}

function findBestMove(board: Board, aiBotId: string, players: PlayerInfo[], maxDepth: number): number {
    const aiPlayer = players.find(p => p.userId === aiBotId);
    const humanPlayer = players.find(p => p.userId !== aiBotId);
    if (!aiPlayer || !humanPlayer) return -1;

    let bestVal = -1000;
    let bestMove = -1;

    const available = [];
    for (let i = 0; i < 9; i++) {
        if (!board[i]) available.push(i);
    }
    if (available.length === 0) return -1;
    available.sort(() => Math.random() - 0.5); // Randomize equal branches

    for (const i of available) {
        board[i] = aiPlayer.symbol;
        const moveVal = minimax(board, maxDepth - 1, false, aiPlayer.symbol, humanPlayer.symbol);
        board[i] = null;

        if (moveVal > bestVal) {
            bestMove = i;
            bestVal = moveVal;
        }
    }
    return bestMove;
}

// QUANTUM MOVE
function handleMakeQuantumMove(
  gameState: GameState,
  sender: Presence,
  data: { positions: number[] },
  dispatcher: Dispatcher,
  nk: Nakama,
  logger: Logger,
): void {
  if (!data || typeof data !== "object") {
    logger.warn("Rejected quantum move from %s because payload is invalid", sender.userId);
    applyTrustPenalty(nk, sender.userId, "invalid_quantum_payload", 8, logger);
    sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 400, message: "Invalid payload" }), sender);
    return;
  }
  if (gameState.phase !== "playing") {
    applyTrustPenalty(nk, sender.userId, "quantum_move_outside_playing_phase", 5, logger);
    sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 403, message: "Game is not in playing phase" }), sender);
    return;
  }
  if (!hasTwoConnectedPlayers(gameState)) {
    sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 409, message: "Game is paused while a player reconnects" }), sender);
    return;
  }
  if (gameState.currentTurn !== sender.userId) {
    applyTrustPenalty(nk, sender.userId, "quantum_played_out_of_turn", 8, logger);
    sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 403, message: "Not your turn" }), sender);
    return;
  }

  if (gameState.turnStartedAt && Date.now() - gameState.turnStartedAt < RAPID_MOVE_THRESHOLD_MS) {
    applyTrustPenalty(nk, sender.userId, "rapid_quantum_move_under_50ms", 12, logger);
  }

  if (gameState.moveCount >= 9) {
    logger.warn("Rejected quantum move from %s because board is full", sender.userId);
    sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 400, message: "Board is full" }), sender);
    return;
  }
  
  const positions = data.positions;
  if (!Array.isArray(positions) || positions.length !== 2) {
    applyTrustPenalty(nk, sender.userId, "invalid_quantum_payload", 8, logger);
    sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 400, message: "Quantum move requires exactly 2 positions" }), sender);
    return;
  }

  for (const pos of positions) {
      if (typeof pos !== "number" || pos < 0 || pos > 8 || gameState.board[pos] !== null) {
          applyTrustPenalty(nk, sender.userId, "invalid_quantum_position", 8, logger);
          sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 400, message: "Invalid or occupied position in quantum move" }), sender);
          return;
      }
  }

  if (positions[0] === positions[1]) {
      applyTrustPenalty(nk, sender.userId, "duplicate_quantum_positions", 6, logger);
      sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 400, message: "Quantum move positions must be distinct" }), sender);
      return;
  }

  if (!gameState.quantumUsed) gameState.quantumUsed = {};
  if (gameState.quantumUsed[sender.userId]) {
      applyTrustPenalty(nk, sender.userId, "quantum_reuse_attempt", 10, logger);
      sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 403, message: "Quantum move already used this game" }), sender);
      return;
  }

  const player = gameState.players.find((entry) => entry.userId === sender.userId);
  if (!player) {
    logger.warn("Rejected quantum move from %s because player not found in match", sender.userId);
    applyTrustPenalty(nk, sender.userId, "player_not_found", 10, logger);
    sendToPresence(dispatcher, OpCode.ERROR, JSON.stringify({ code: 403, message: "Player not found in match" }), sender);
    return;
  }

  const p0 = positions[0] as number;
  const p1 = positions[1] as number;
  gameState.board[p0] = player.symbol;
  gameState.board[p1] = player.symbol;
  gameState.quantumUsed[sender.userId] = true;
  gameState.moveCount += 2;
  recordMove(gameState, player, [p0, p1], "quantum");
  trackMoveAnalytics(nk, gameState, [p0, p1], true, logger);

  const winLine = checkWin(gameState.board);
  if (winLine) {
    gameState.winLine = winLine;
    completeGame(gameState, dispatcher, nk, logger, sender.userId, "win", {
      reason: "win",
      winner: sender.userId,
    });
    logger.info("Player %s won the game with a Quantum Move!", player.username);
  } else if (gameState.moveCount >= 9) {
    completeGame(gameState, dispatcher, nk, logger, null, "draw", {
      reason: "draw",
    });
    logger.info("Game ended in a draw");
  } else {
    const nextPlayer = gameState.players.find((entry) => entry.userId !== sender.userId);
    if (nextPlayer) {
      gameState.currentTurn = nextPlayer.userId;
      gameState.turnStartedAt = Date.now();
      if (gameState.mode === "timed") {
        gameState.turnDeadline = Date.now() + (TURN_TIMEOUT_SECONDS * 1000);
      }
    }
  }

  broadcastToMatch(dispatcher, OpCode.GAME_STATE, JSON.stringify(gameState));
}

function InitModule(ctx: Context, logger: Logger, nk: Nakama, initializer: Initializer): void {
  logger.info("Initializing LILA TicTacToe module");

  initializer.registerMatch("tictactoe", {
    matchInit: matchInit,
    matchJoinAttempt: matchJoinAttempt,
    matchJoin: matchJoin,
    matchLeave: matchLeave,
    matchLoop: matchLoop,
    matchTerminate: matchTerminate,
    matchSignal: matchSignal,
  });
  initializer.registerMatchmakerMatched(matchmakerMatched);

  initializer.registerRpc("find_or_create_match", findOrCreateMatch);
  initializer.registerRpc("create_private_match", createPrivateMatch);
  initializer.registerRpc("join_private_match", joinPrivateMatch);
  initializer.registerRpc("get_leaderboard", getLeaderboard);
  initializer.registerRpc("get_player_stats", getPlayerStats);
  initializer.registerRpc("get_match_replay", getMatchReplay);
  initializer.registerRpc("get_analytics", getAnalyticsRpc);
  initializer.registerRpc("get_live_activity", getLiveActivity);
  logger.info("LILA TicTacToe module initialized");
}
