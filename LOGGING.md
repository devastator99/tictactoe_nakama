# LIVA Logging Guide

Comprehensive logging strategy for server-authoritative multiplayer Tic-Tac-Toe.

## Overview

The project uses structured logging across all layers:

- **Frontend (React)**: Pino logger
- **Mobile (React Native)**: Console with log level control
- **Backend (Nakama)**: Docker logs
- **Runtime (TypeScript)**: Console logs

## Frontend Logging

### Configuration

Located in `frontend/src/lib/logger.ts`:

```typescript
import pino from 'pino'

const baseLogger = pino({
  level: import.meta.env.DEV ? 'debug' : 'info',
  browser: {
    asObject: true,
  },
})

export const logger = baseLogger.child({ app: 'lila-frontend' })
```

### Usage

```typescript
import { logger } from '../lib/logger'

logger.info({ matchId: 'match-123' }, 'Player joined match')
logger.error({ error: err }, 'Failed to authenticate')
logger.debug({ state }, 'Game state updated')
```

### Log Levels

- **debug**: Development details
- **info**: Important business events (matches, scores, auth)
- **warn**: Unexpected but recoverable situations
- **error**: Failures requiring attention
- **fatal**: Critical system failures

## Mobile Logging

### Configuration

Use the logger utility in `LIVAMobile/src/utils/logger.ts`:

```typescript
import { Log } from '../utils/logger'

Log.info('match', { matchId: '123' }, 'Player joined')
Log.error('network', { status: 500 }, 'Connection failed')
```

### Features

- Categorized by module/feature
- Structured JSON format
- Log level control via environment
- Console and file output options

## Backend Logging

### Docker Logs

View live Nakama logs:

```bash
cd nakama
docker compose logs -f nakama
```

View PostgreSQL logs:

```bash
docker compose logs -f postgres
```

### Log Pattern

Nakama logs include:
- Server startup messages
- RPC call logs
- Match runtime logs
- Storage operations
- Error traces

## Runtime Logging

### Access Backend Console

View aggregated logs:

```bash
make local-logs
```

Filter by service:

```bash
docker compose logs -f nakama --tail=100
docker compose logs -f postgres --tail=50
docker compose logs -f redis --tail=50
```

## Environment Variables

### Frontend

```bash
# .env.local
VITE_LOG_LEVEL=debug      # debug|info|warn|error
VITE_LOG_FORMAT=json      # json|text
```

### Mobile

```bash
# Set via constant in src/utils/logger.ts
LOG_LEVEL='debug'
```

### Backend

```bash
# config/local.yml
log:
  level: debug
  format: json
```

## Log Aggregation Strategy

### Development

1. **Frontend**: Open browser DevTools Console
   - Pino logs appear as structured JSON objects
   - Filter by app name: `{app: 'lila-frontend'}`

2. **Mobile**: Check React Native debugger
   - Run `react-native start` and open debugger
   - All Log.* calls appear in console

3. **Backend**: Use `make local-logs`
   - Streams all Docker service logs
   - Color-coded by service
   - Real-time updates

### Production

Consider infrastructure:
- **Log shipping**: Use ELK Stack, Datadog, or CloudWatch
- **Centralized storage**: Store logs in cloud database
- **Monitoring**: Set up alerts for error rates
- **Retention**: Archive logs after 30 days

## Best Practices

### ✅ DO

```typescript
// Structured data
logger.info({ matchId, playerId, turn }, 'Move executed')

// Context tags
logger.child({ matchId }).info('Player disconnected')

// Timing information
logger.info({ duration: 1234 }, 'Request completed')
```

### ❌ DON'T

```typescript
// String concatenation
logger.info(`Player ${id} joined match ${matchId}`)

// Bare console logs
console.log('Error:', err)

// Oversized payloads
logger.info({ entireGameState })
```

## Makefile Commands

```bash
make local-logs           # Stream all backend logs
make frontend-dev         # Start frontend (see browser console)
make check               # Run all tests with logging
```

## Troubleshooting

### Missing logs in development

**Problem**: No logs appearing in browser console  
**Solution**: 
1. Check `VITE_LOG_LEVEL` is set (default: debug)
2. Ensure logger is imported: `import { logger } from '../lib/logger'`
3. Open DevTools → Console tab

### Mobile console not showing logs

**Problem**: React Native logs not visible  
**Solution**:
1. Open React Native debugger: `react-native start`
2. Enable "Debug JS" in the app menu
3. Logs will appear in DevTools console

### Backend logs too verbose

**Problem**: Docker logs overwhelming  
**Solution**:
```bash
# Filter by service
docker compose logs -f nakama --tail=50

# Filter by keyword
docker compose logs nakama | grep "error"
```

## Future Enhancements

- [ ] Structured log export to JSON files
- [ ] Log rotation based on size
- [ ] Performance metrics (P50, P95, P99 latencies)
- [ ] Real-time dashboard for logs
- [ ] Distributed tracing (trace IDs across services)
