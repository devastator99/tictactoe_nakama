import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// @ts-ignore
const MMKV = require('react-native-mmkv').default || require('react-native-mmkv');
import type {
  AuthUser,
  GameState,
  LeaderboardEntry,
  PlayerStats,
  ActivityEvent,
  ReplayRecord,
  AnalyticsData,
  VoiceSignalMessage,
  GameMode,
} from '../types';

const mmkv = new MMKV({ id: 'zustand-storage' });

const zustandStorage = {
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.delete(name),
};

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      isLoading: false,
      login: user => set({ user }),
      logout: () => set({ user: null }),
      setLoading: isLoading => set({ isLoading }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({ user: state.user }),
    }
  )
);

interface GameStateStore {
  gameState: GameState | null;
  matchId: string | null;
  isConnected: boolean;
  lastVoiceSignal: VoiceSignalMessage | null;
  setGameState: (state: GameState | null) => void;
  setMatchId: (id: string | null) => void;
  setConnected: (connected: boolean) => void;
  setVoiceSignal: (signal: VoiceSignalMessage | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStateStore>(set => ({
  gameState: null,
  matchId: null,
  isConnected: false,
  lastVoiceSignal: null,
  setGameState: gameState => set({ gameState }),
  setMatchId: matchId => set({ matchId }),
  setConnected: isConnected => set({ isConnected }),
  setVoiceSignal: lastVoiceSignal => set({ lastVoiceSignal }),
  reset: () => set({ gameState: null, matchId: null, isConnected: false, lastVoiceSignal: null }),
}));

interface LeaderboardState {
  entries: LeaderboardEntry[];
  playerStats: PlayerStats | null;
  isLoading: boolean;
  setEntries: (entries: LeaderboardEntry[]) => void;
  setPlayerStats: (stats: PlayerStats | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useLeaderboardStore = create<LeaderboardState>(set => ({
  entries: [],
  playerStats: null,
  isLoading: false,
  setEntries: entries => set({ entries }),
  setPlayerStats: playerStats => set({ playerStats }),
  setLoading: isLoading => set({ isLoading }),
}));

interface SettingsState {
  theme: 'cyberpunk' | 'retro' | 'minimal';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  voiceEnabled: boolean;
  setTheme: (theme: 'cyberpunk' | 'retro' | 'minimal') => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      theme: 'cyberpunk',
      soundEnabled: true,
      hapticsEnabled: true,
      voiceEnabled: true,
      setTheme: theme => set({ theme }),
      setSoundEnabled: soundEnabled => set({ soundEnabled }),
      setHapticsEnabled: hapticsEnabled => set({ hapticsEnabled }),
      setVoiceEnabled: voiceEnabled => set({ voiceEnabled }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

interface MetaState {
  liveActivity: ActivityEvent[];
  replays: ReplayRecord[];
  analytics: AnalyticsData | null;
  selectedMode: GameMode;
  setLiveActivity: (items: ActivityEvent[]) => void;
  setReplays: (items: ReplayRecord[]) => void;
  setAnalytics: (analytics: AnalyticsData | null) => void;
  setSelectedMode: (mode: GameMode) => void;
}

export const useMetaStore = create<MetaState>(set => ({
  liveActivity: [],
  replays: [],
  analytics: null,
  selectedMode: 'classic',
  setLiveActivity: liveActivity => set({ liveActivity }),
  setReplays: replays => set({ replays }),
  setAnalytics: analytics => set({ analytics }),
  setSelectedMode: selectedMode => set({ selectedMode }),
}));