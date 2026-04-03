import {Client, Session, Socket, Match} from '@heroiclabs/nakama-js';
import type {
  GameMode,
  MatchInfo,
  OpCode,
  LeaderboardEntry,
  PlayerStats,
  ActivityEvent,
  AnalyticsData,
  ReplayRecord,
} from '../types';
import {getStorageItem, setStorageItem, removeStorageItem} from '../utils/storage';
import {Log} from '../utils/logger';

const NAKAMA_HOST = 'localhost';
const NAKAMA_PORT = 7350;
const NAKAMA_SSL = false;
const SERVER_KEY = 'lila-tictactoe-server-key';
const SESSION_STORAGE_KEY = 'lila.session';

const DEFAULT_PLAYER_STATS: PlayerStats = {
  wins: 0,
  losses: 0,
  draws: 0,
  winStreak: 0,
  bestStreak: 0,
  totalGames: 0,
};

export type MessageHandler = (opCode: OpCode, data: any) => void;
export type ConnectionHandler = (isConnected: boolean) => void;

interface StoredSession {
  token: string;
  refreshToken: string;
}

const safeJsonParse = <T>(payload: any, fallback: T): T => {
  try {
    if (!payload) return fallback;
    if (typeof payload === 'object') return payload as T;
    return JSON.parse(payload) as T;
  } catch {
    return fallback;
  }
};

class NakamaService {
  private client: Client;
  private session: Session | null = null;
  private socket: Socket | null = null;
  private currentMatch: Match | null = null;
  private messageHandler: MessageHandler | null = null;
  private connectionHandler: ConnectionHandler | null = null;

  constructor() {
    this.client = new Client(SERVER_KEY, NAKAMA_HOST, NAKAMA_PORT.toString(), NAKAMA_SSL);
  }

  async authenticateDevice(
    deviceId: string,
    username?: string,
  ): Promise<Session> {
    this.session = await this.client.authenticateDevice(
      deviceId,
      true,
      username,
    );
    this.persistSession(this.session);
    return this.session;
  }

  async authenticateEmail(
    email: string,
    password: string,
    username?: string,
  ): Promise<Session> {
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
    if (!this.session) throw new Error('Not authenticated');
    await this.client.updateAccount(this.session, {username});
  }

  getSession(): Session | null {
    return this.session;
  }

  setSession(session: Session): void {
    this.session = session;
    this.persistSession(session);
  }

  restoreSession(): Session | null {
    const rawSession = getStorageItem(SESSION_STORAGE_KEY);
    if (!rawSession) return null;

    try {
      const stored = safeJsonParse<StoredSession | null>(rawSession, null);
      if (!stored?.token || !stored?.refreshToken) {
        this.clearSession();
        return null;
      }

      const session = Session.restore(stored.token, stored.refreshToken);
      this.session = session;
      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  clearSession(): void {
    this.session = null;
    removeStorageItem(SESSION_STORAGE_KEY);
  }

  async signOut(): Promise<void> {
    await this.disconnect();
    this.clearSession();
  }

  async connect(): Promise<Socket> {
    if (!this.session) throw new Error('No session — authenticate first');
    if (this.socket) return this.socket;

    this.socket = this.client.createSocket(NAKAMA_SSL, false);

    this.socket.onmatchdata = matchData => {
      if (!this.messageHandler) return;
      try {
        const data = matchData.data
          ? safeJsonParse(String.fromCharCode.apply(null, Array.from(matchData.data)), {})
          : {};
        this.messageHandler(matchData.op_code as OpCode, data);
      } catch (e) {
        Log.error('nakama', { error: String(e) }, 'Failed to parse match data');
      }
    };

    this.socket.ondisconnect = () => {
      this.socket = null;
      this.currentMatch = null;
      this.notifyConnectionChange(false);
    };

    this.socket.onerror = (err: any) => {
      Log.error('nakama', { error: String(err) }, 'Socket connection error');
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

  async findOrCreateMatch(mode: GameMode = 'classic'): Promise<{
    ticket: string;
    matchId?: string;
    mode: string;
    direct: boolean;
    shadowBanned: boolean;
  }> {
    if (!this.session) throw new Error('Not authenticated');
    const result = await this.client.rpc(this.session, 'find_or_create_match', {
      mode,
    });
    const parsed = safeJsonParse(result.payload, {} as any);
    return {
      ticket: parsed.ticket || '',
      matchId: parsed.matchId,
      mode: parsed.mode || 'classic',
      direct: parsed.direct || false,
      shadowBanned: parsed.shadowBanned || false,
    };
  }

  async createPrivateMatch(mode: GameMode = 'classic'): Promise<MatchInfo> {
    if (!this.session) throw new Error('Not authenticated');
    const result = await this.client.rpc(
      this.session,
      'create_private_match',
      {mode},
    );
    const parsed = safeJsonParse(result.payload, {matchId: '', mode});
    return parsed;
  }

  async joinPrivateMatch(code: string): Promise<{matchId: string}> {
    if (!this.session) throw new Error('Not authenticated');
    const result = await this.client.rpc(this.session, 'join_private_match', {
      code,
    });
    return safeJsonParse(result.payload, {matchId: ''});
  }

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
    if (!this.socket || !this.currentMatch) throw new Error('Not in a match');
    await this.socket.sendMatchState(
      this.currentMatch.match_id,
      101 as OpCode,
      JSON.stringify({position}),
    );
  }

  async sendQuantumMove(positions: number[]): Promise<void> {
    if (!this.socket || !this.currentMatch) throw new Error('Not in a match');
    await this.socket.sendMatchState(
      this.currentMatch.match_id,
      103 as OpCode,
      JSON.stringify({positions}),
    );
  }

  async requestRematch(): Promise<void> {
    if (!this.socket || !this.currentMatch) throw new Error('Not in a match');
    await this.socket.sendMatchState(
      this.currentMatch.match_id,
      102 as OpCode,
      '{}',
    );
  }

  getCurrentMatchId(): string | null {
    return this.currentMatch?.match_id || null;
  }

  async addToMatchmaker(mode: GameMode = 'classic'): Promise<string> {
    if (!this.socket) await this.connect();
    const ticket = await this.socket!.addMatchmaker(
      `+properties.mode:${mode}`,
      2,
      2,
      {mode},
      {},
    );
    return ticket.ticket;
  }

  async removeFromMatchmaker(ticket: string): Promise<void> {
    if (this.socket) {
      await this.socket.removeMatchmaker(ticket);
    }
  }

  onMatchmakerMatched(handler: (matchId: string) => void): void {
    if (!this.socket) return;
    this.socket.onmatchmakermatched = matched => {
      handler(matched.match_id || matched.token);
    };
  }

  async getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
    if (!this.session) throw new Error('Not authenticated');
    const result = await this.client.rpc(this.session, 'get_leaderboard', {
      limit,
    });
    return safeJsonParse(result.payload, []);
  }

  async getPlayerStats(userId?: string): Promise<PlayerStats> {
    if (!this.session) throw new Error('Not authenticated');
    const result = await this.client.rpc(this.session, 'get_player_stats', {
      userId,
    });
    const parsed = safeJsonParse<PlayerStats>(result.payload, DEFAULT_PLAYER_STATS);
    return {...DEFAULT_PLAYER_STATS, ...parsed};
  }

  async getLiveActivity(limit = 20): Promise<ActivityEvent[]> {
    if (!this.session) throw new Error('Not authenticated');
    const result = await this.client.rpc(this.session, 'get_live_activity', {
      limit,
    });
    const parsed = safeJsonParse(result.payload, {items: [] as ActivityEvent[]});
    return parsed.items || [];
  }

  async getAnalytics(): Promise<AnalyticsData> {
    if (!this.session) throw new Error('Not authenticated');
    const result = await this.client.rpc(this.session, 'get_analytics', {});
    return safeJsonParse(result.payload, {} as AnalyticsData);
  }

  async getReplay(matchId: string): Promise<ReplayRecord | null> {
    if (!this.session) throw new Error('Not authenticated');
    const result = await this.client.rpc(this.session, 'get_match_replay', {
      matchId,
    });
    const parsed = safeJsonParse(result.payload, {replay: null as ReplayRecord | null});
    return parsed.replay;
  }

  async getRecentReplays(limit = 10): Promise<ReplayRecord[]> {
    if (!this.session) throw new Error('Not authenticated');
    const result = await this.client.rpc(this.session, 'get_match_replay', {
      limit,
    });
    const parsed = safeJsonParse(result.payload, {items: [] as ReplayRecord[]});
    return parsed.items || [];
  }

  private persistSession(session: Session): void {
    const stored: StoredSession = {
      token: session.token,
      refreshToken: session.refresh_token,
    };
    setStorageItem(SESSION_STORAGE_KEY, JSON.stringify(stored));
  }

  private notifyConnectionChange(isConnected: boolean): void {
    this.connectionHandler?.(isConnected);
  }
}

export const nakamaService = new NakamaService();
export default nakamaService;