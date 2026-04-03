# LIVAMobile - React Native Tic-Tac-Toe

Server-authoritative multiplayer Tic-Tac-Toe mobile app built with React Native CLI (No Expo).

## Architecture

```
LIVAMobile/
├── src/
│   ├── components/
│   │   ├── common/          # Button, GlassCard, TabBar, StatusScreen
│   │   └── game/            # GameBoard, PlayerCard, TimerRing, GameOverOverlay
│   ├── screens/
│   │   ├── auth/            # LoginScreen
│   │   ├── lobby/           # LobbyScreen
│   │   ├── game/            # GameScreen
│   │   ├── leaderboard/     # LeaderboardScreen
│   │   ├── replay/          # ReplayScreen
│   │   ├── analytics/       # AnalyticsScreen
│   │   └── settings/        # SettingsScreen
│   ├── services/            # Nakama service wrapper
│   ├── store/               # Zustand state management
│   ├── hooks/               # useNakama, useTimer
│   ├── theme/               # Colors, typography
│   └── utils/               # Responsive utilities, storage
├── ios/                     # iOS native code
├── android/                 # Android native code
└── App.tsx                  # Main entry with navigation
```

## Features

- **Responsive UI**: Adaptive layouts for phones and tablets
- **Modern Design**: Glassmorphism cards with blur effects
- **Theme System**: Cyberpunk, Retro, and Minimal themes
- **Real-time Multiplayer**: WebSocket-based Nakama integration
- **State Persistence**: MMKV for fast local storage
- **Anti-cheat**: Server-authoritative game logic
- **Voice Chat**: WebRTC signaling support

## Quick Start

```bash
# Install dependencies
cd LIVAMobile
npm install

# iOS
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

## Development

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Tests
npm run test
```

## UI Components

### GlassCard
Modern glassmorphism card with blur effect:
```tsx
<GlassCard intensity="medium" bordered glowColor={Colors.primary.cyan}>
  <Text>Content</Text>
</GlassCard>
```

### Responsive Utilities
```tsx
import { wp, hp, rf, ms, isTablet } from '../utils/responsive';

const styles = StyleSheet.create({
  container: {
    width: wp(90),        // 90% of screen width
    height: hp(30),       // 30% of screen height
    fontSize: rf(16),     // Responsive font size
    padding: ms(12),      // Moderate scale
  },
});
```

## Backend Validation

### Optimized AI Tests
```bash
cd nakama/data/modules
npm run test:unit
```

### Scalability Analysis
```bash
cd nakama/data/modules
npm run test:scalability
```

## Theme Configuration

Three themes available:
- **Cyberpunk**: Neon sci-fi aesthetic (default)
- **Retro**: Warm vintage tones
- **Minimal**: Clean dark design

## State Management

Uses Zustand with MMKV persistence:
- Auth state (persisted)
- Game state (real-time)
- Settings (persisted)
- Leaderboard (cached)

## Navigation Structure

```
App
├── Login (if not authenticated)
└── Main (authenticated)
    ├── Lobby Tab
    ├── Leaderboard Tab
    ├── Analytics Tab
    ├── Settings Tab
    ├── Game Screen (modal)
    └── Replay Screen (modal)
```

## Nakama Integration

All game truth lives on the server. The mobile app:
- Sends intents (move, quantum move, rematch)
- Receives canonical state via WebSocket
- Handles real-time player presence
- Supports matchmaking and private rooms