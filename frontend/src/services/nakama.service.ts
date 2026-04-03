// =============================================================================
// nakama.service.ts — Nakama client wrapper
// Manages connection lifecycle, auth, matchmaking, and real-time messaging
// =============================================================================

import { Client, Session, Socket, Match } from "@heroiclabs/nakama-js";
import { z } from "zod";
import { GameMode, MatchInfo, OpCode, LeaderboardEntry, PlayerStats, ActivityEvent, AnalyticsData, ReplayRecord } from "@/types";
import { buildMatchmakerQuery, parseJsonPayload } from "@/lib/client-utils";
import { logger } from "@/lib/logger";

// ── Config ────────────────────────────────────────────────────────────────────
const NAKAMA_HOST   = import.meta.env.VITE_NAKAMA_HOST   || "localhost";
const NAKAMA_PORT   = import.meta.env.VITE_NAKAMA_PORT   || "7350";
const NAKAMA_SSL    = import.meta.env.VITE_NAKAMA_SSL    === "true";
const SERVER_KEY    = import.meta.env.VITE_NAKAMA_KEY    || "lila-tictactoe-server-key";
const SESSION_STORAGE_KEY = "lila.session";

export type MessageHandler = (opCode: OpCode, data: unknown) => void;
export type ConnectionHandler = (isConnected: boolean) => void;

interface StoredSession {
  token: string;
  refreshToken: string;
}

const DEFAULT_PLAYER_STATS: PlayerStats = {
  wins: 0,
  losses: 0,
  draws: 0,
  winStreak: 0,
  bestStreak: 0,
  totalGames: 0,
};

const FindOrCreateMatchResponseSchema = z.object({
  ticket: z.string().optional().default(""),
  matchId: z.string().optional(),
  mode: z.string().optional().default("classic"),
  direct: z.boolean().optional().default(false),
  shadowBanned: z.boolean().optional().default(false),
});

const ActivityFeedSchema = z.object({
  items: z.array(z.custom<ActivityEvent>()).default([]),
});

const AnalyticsSchema = z.custom<AnalyticsData>();
const ReplayResponseSchema = z.object({
  replay: z.custom<ReplayRecord>().optional(),
  items: z.array(z.custom<ReplayRecord>()).optional().default([]),
});

class NakamaService {
  private client: Client;
  private session: Session | null = null;
  private socket: Socket | null = null;
  private currentMatch: Match | null = null;
  private messageHandler: MessageHandler | null = null;
  private connectionHandler: ConnectionHandler | null = null;
  private matchmakerMatchedHandler: ((matchId: string) => void) | null = null;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTTL = 30000;

  constructor() {
    this.client = new Client(SERVER_KEY, NAKAMA_HOST, NAKAMA_PORT, NAKAMA_SSL);
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.cacheTTL) {
      return entry.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async authenticateDevice(deviceId: string, username?: string): Promise<Session> {
    this.session = await this.client.authenticateDevice(
      deviceId,
      true,           // create if not exists
      username,
    );
    this.persistSession(this.session);
    return this.session;
  }

  async authenticateEmail(email: string, password: string, username?: string): Promise<Session> {
    this.session = await this.client.authenticateEmail(
      email,
      password,
      true,
      username,
    );
    this.persistSession(this.session);
    return this.session;
  }

  async refreshSession(): Promise<Session | null> {
    if (!this.session) return null;
    if (!this.session.isexpired(Date.now() / 1000)) return this.session;
    try {
      this.session = await this.client.sessionRefresh(this.session);
      this.persistSession(this.session);
      return this.session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  async updateUsername(username: string): Promise<void> {
    if (!this.session) throw new Error("Not authenticated");
    await this.client.updateAccount(this.session, { username });
  }

  getSession(): Session | null { return this.session; }

  setSession(session: Session): void {
    this.session = session;
    this.persistSession(session);
  }

  restoreSession(): Session | null {
    if (typeof window === "undefined") return null;

    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) return null;

    try {
      const storedSession = parseJsonPayload<StoredSession | null>(rawSession, null);
      if (!storedSession) {
        this.clearSession();
        return null;
      }

      if (!storedSession.token || !storedSession.refreshToken) {
        this.clearSession();
        return null;
      }

      const session = Session.restore(storedSession.token, storedSession.refreshToken);
      this.session = session;
      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  clearSession(): void {
    this.session = null;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  async signOut(): Promise<void> {
    await this.disconnect();
    this.clearSession();
    this.clearCache();
  }

  // ── Socket ────────────────────────────────────────────────────────────────

  async connect(): Promise<Socket> {
    if (!this.session) throw new Error("No session — authenticate first");
    if (this.socket) return this.socket;

    this.socket = this.client.createSocket(NAKAMA_SSL, false);

    this.socket.onmatchdata = (matchData) => {
      if (!this.messageHandler) return;
      try {
        const data = matchData.data
          ? parseJsonPayload(new TextDecoder().decode(matchData.data), {})
          : {};
        this.messageHandler(matchData.op_code as OpCode, data);
      } catch (e) {
        logger.error({ error: e }, "Failed to parse match data");
      }
    };

    this.socket.ondisconnect = () => {
      logger.warn("Nakama socket disconnected");
      this.socket = null;
      this.currentMatch = null;
      this.notifyConnectionChange(false);
    };

    this.socket.onerror = (err) => {
      logger.error({ error: err }, "Nakama socket error");
    };

    this.socket.onmatchmakermatched = (matched) => {
      this.matchmakerMatchedHandler?.(matched.match_id || matched.token);
    };

    await this.socket.connect(this.session, true);
    this.notifyConnectionChange(true);
    return this.socket;
  }

  async disconnect(): Promise<void> {
    if (this.currentMatch) {
      await this.leaveMatch();
    }
    if (this.socket) {
      this.socket.disconnect(false);
      this.socket = null;
    }
    this.currentMatch = null;
    this.notifyConnectionChange(false);
  }

  setMessageHandler(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  removeMessageHandler(): void {
    this.messageHandler = null;
  }

  setConnectionHandler(handler: ConnectionHandler): void {
    this.connectionHandler = handler;
  }

  removeConnectionHandler(): void {
    this.connectionHandler = null;
  }

  isConnected(): boolean {
    return this.socket !== null;
  }

  // ── Matchmaking ────────────────────────────────────────────────────────────

  async findOrCreateMatch(mode: GameMode = "classic"): Promise<{
    ticket: string;
    matchId?: string;
    mode: string;
    direct: boolean;
    shadowBanned: boolean;
  }> {
    if (!this.session) throw new Error("Not authenticated");
    const result = await this.client.rpc(this.session, "find_or_create_match", { mode });
    const parsed = parseJsonPayload<unknown>(result.payload, {});
    return FindOrCreateMatchResponseSchema.parse(parsed);
  }

  async createPrivateMatch(mode: GameMode = "classic"): Promise<MatchInfo> {
    if (!this.session) throw new Error("Not authenticated");
    const result = await this.client.rpc(
      this.session,
      "create_private_match",
      { mode },
    );
    return parseJsonPayload<MatchInfo>(result.payload, { matchId: "", mode });
  }

  async joinPrivateMatch(code: string): Promise<{ matchId: string }> {
    if (!this.session) throw new Error("Not authenticated");
    const result = await this.client.rpc(
      this.session,
      "join_private_match",
      { code },
    );
    return parseJsonPayload<{ matchId: string }>(result.payload, { matchId: "" });
  }

  // ── Match ─────────────────────────────────────────────────────────────────

  async joinMatch(matchId: string): Promise<Match> {
    if (!this.socket) await this.connect();
    this.currentMatch = await this.socket!.joinMatch(matchId);
    return this.currentMatch;
  }

  async leaveMatch(): Promise<void> {
    if (this.socket && this.currentMatch) {
      await this.socket.leaveMatch(this.currentMatch.match_id);
      this.currentMatch = null;
    }
  }

  async sendMove(position: number): Promise<void> {
    if (!this.socket || !this.currentMatch) throw new Error("Not in a match");
    await this.socket.sendMatchState(
      this.currentMatch.match_id,
      OpCode.MAKE_MOVE,
      JSON.stringify({ position }),
    );
  }

  async sendQuantumMove(positions: number[]): Promise<void> {
    if (!this.socket || !this.currentMatch) throw new Error("Not in a match");
    await this.socket.sendMatchState(
      this.currentMatch.match_id,
      OpCode.MAKE_QUANTUM_MOVE,
      JSON.stringify({ positions }),
    );
  }

  async requestRematch(): Promise<void> {
    if (!this.socket || !this.currentMatch) throw new Error("Not in a match");
    await this.socket.sendMatchState(
      this.currentMatch.match_id,
      OpCode.REQUEST_REMATCH,
      "{}",
    );
  }

  async sendVoiceSignal(signalType: "offer" | "answer" | "ice-candidate" | "mute-state", payload: unknown, targetUserId?: string): Promise<void> {
    if (!this.socket || !this.currentMatch) throw new Error("Not in a match");
    await this.socket.sendMatchState(
      this.currentMatch.match_id,
      OpCode.VOICE_SIGNAL,
      JSON.stringify({
        signalType: signalType,
        payload: payload || null,
        targetUserId: targetUserId || null,
      }),
    );
  }

  getCurrentMatchId(): string | null {
    return this.currentMatch?.match_id || null;
  }

  // ── Matchmaker via socket ─────────────────────────────────────────────────

  async addToMatchmaker(mode: GameMode = "classic"): Promise<string> {
    if (!this.socket) await this.connect();
    const ticket = await this.socket!.addMatchmaker(
      buildMatchmakerQuery(mode),
      2,            // min
      2,            // max
      { mode },     // string props
      {},           // numeric props
    );
    return ticket.ticket;
  }

  async removeFromMatchmaker(ticket: string): Promise<void> {
    if (this.socket) {
      await this.socket.removeMatchmaker(ticket);
    }
  }

  onMatchmakerMatched(handler: (matchId: string) => void): void {
    this.matchmakerMatchedHandler = handler;

    if (this.socket) {
      this.socket.onmatchmakermatched = (matched) => {
        handler(matched.match_id || matched.token);
      };
    }
  }

  // ── Leaderboard ────────────────────────────────────────────────────────────

  async getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
    const cacheKey = `leaderboard_${limit}`;
    const cached = this.getCached<LeaderboardEntry[]>(cacheKey);
    if (cached) return cached;
    if (!this.session) throw new Error("Not authenticated");
    const result = await this.client.rpc(
      this.session,
      "get_leaderboard",
      { limit },
    );
    const data = parseJsonPayload<LeaderboardEntry[]>(result.payload, []);
    this.setCache(cacheKey, data);
    return data;
  }

  async getPlayerStats(userId?: string): Promise<PlayerStats> {
    const cacheKey = `stats_${userId || 'self'}`;
    const cached = this.getCached<PlayerStats>(cacheKey);
    if (cached) return cached;
    if (!this.session) throw new Error("Not authenticated");
    const result = await this.client.rpc(
      this.session,
      "get_player_stats",
      { userId },
    );
    const data = parseJsonPayload<PlayerStats>(result.payload, DEFAULT_PLAYER_STATS);
    this.setCache(cacheKey, data);
    return data;
  }

  async getLiveActivity(limit = 20): Promise<ActivityEvent[]> {
    const cacheKey = `liveactivity_${limit}`;
    const cached = this.getCached<ActivityEvent[]>(cacheKey);
    if (cached) return cached;
    if (!this.session) throw new Error("Not authenticated");
    const result = await this.client.rpc(
      this.session,
      "get_live_activity",
      { limit },
    );
    const payload = parseJsonPayload<unknown>(result.payload, {});
    const data = ActivityFeedSchema.parse(payload).items;
    this.setCache(cacheKey, data);
    return data;
  }

  async getAnalytics(): Promise<AnalyticsData> {
    if (!this.session) throw new Error("Not authenticated");
    const result = await this.client.rpc(this.session, "get_analytics", {});
    const payload = parseJsonPayload<unknown>(result.payload, {});
    return AnalyticsSchema.parse(payload);
  }

  async getReplay(matchId: string): Promise<ReplayRecord | null> {
    if (!this.session) throw new Error("Not authenticated");
    const result = await this.client.rpc(this.session, "get_match_replay", { matchId });
    const payload = parseJsonPayload<unknown>(result.payload, {});
    const parsed = ReplayResponseSchema.parse(payload);
    return parsed.replay || null;
  }

  async getRecentReplays(limit = 10): Promise<ReplayRecord[]> {
    if (!this.session) throw new Error("Not authenticated");
    const result = await this.client.rpc(this.session, "get_match_replay", { limit });
    const payload = parseJsonPayload<unknown>(result.payload, {});
    const parsed = ReplayResponseSchema.parse(payload);
    return parsed.items || [];
  }

  private persistSession(session: Session): void {
    if (typeof window === "undefined") return;

    const storedSession: StoredSession = {
      token: session.token,
      refreshToken: session.refresh_token,
    };

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(storedSession));
  }

  private notifyConnectionChange(isConnected: boolean): void {
    this.connectionHandler?.(isConnected);
  }
}

// Singleton instance
export const nakamaService = new NakamaService();
export default nakamaService;
