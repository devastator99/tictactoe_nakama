# Logging Quick Reference

## View Logs

### All Backend Services
```bash
make local-logs
```

### Specific Services
```bash
make local-logs-nakama      # Nakama server only
make local-logs-postgres    # Database only
make local-logs-redis       # Cache only
```

### Filter Logs in Real-Time
```bash
# Show last 50 lines of Nakama logs
docker compose -f nakama/docker-compose.yml logs --tail=50 nakama

# Follow logs with grep filter
docker compose -f nakama/docker-compose.yml logs nakama | grep "error"

# View logs from last 30 minutes
docker compose -f nakama/docker-compose.yml logs --since=30m nakama
```

## Frontend Logging

### Where to Find Logs
Open browser DevTools:
- **Chrome/Edge**: F12 or Right-click → Inspect → Console
- **Firefox**: F12 → Console
- **Safari**: Develop menu → Show Web Inspector

### Log Examples
```typescript
import { logger } from './lib/logger'

logger.debug({ playerId: 'p1' }, 'Debug message')
logger.info({ matchId: 'match-123' }, 'Match started')
logger.warn({ status: 400 }, 'Unexpected response')
logger.error({ error: err }, 'Request failed')
```

### Control Log Level
Edit `frontend/.env.local`:
```
VITE_LOG_LEVEL=debug    # Show all logs
VITE_LOG_LEVEL=info     # Hide debug logs
VITE_LOG_LEVEL=warn     # Show warn + error only
VITE_LOG_LEVEL=error    # Show error only
```

## Mobile Logging

### Where to Find Logs
```bash
# Method 1: React Native Debugger
react-native start
# Then open the debugger (typically http://localhost:8081/debugger-ui)

# Method 2: Direct console output
# Check terminal where `npm start` is running
```

### Log Examples
```typescript
import { Log } from './utils/logger'

Log.debug('auth', { userId: '123' }, 'User authenticated')
Log.info('game', { matchId: 'abc' }, 'Move executed')
Log.warn('network', { delay: 5000 }, 'Slow connection')
Log.error('nakama', { error: 'timeout' }, 'Connection failed')
```

### Control Log Level
Edit `LIVAMobile/src/utils/logger.ts`:
```typescript
// Change this line:
const ACTIVE_LOG_LEVEL: LogLevel = __DEV__ ? 'debug' : 'info'

// Options:
// __DEV__ ? 'debug' : 'info'     (recommended - debug in dev, info in prod)
// 'debug'                         (always verbose)
// 'info'                          (normal)
// 'warn'                          (warnings + errors only)
// 'error'                         (errors only)
```

## Backend Logging

### View Server Logs
```bash
# All services
make local-logs

# Just the game server
make local-logs-nakama

# Follow specific keywords
docker compose -f nakama/docker-compose.yml logs -f nakama | grep -i "error\|match\|player"
```

### Backend Log Locations
- **Nakama RPC logs**: Search for `rpc_` in logs
- **Match runtime**: Search for `match_` or `Move executed`
- **Database**: `make local-logs-postgres`
- **Cache**: `make local-logs-redis`

## Troubleshooting

### "I don't see any logs"

**Frontend**:
- [ ] Press F12 to open DevTools
- [ ] Click "Console" tab
- [ ] Refresh page (Ctrl+R or Cmd+R)
- [ ] Check log level in `.env.local`

**Mobile**:
- [ ] Ensure `npm start` is running
- [ ] Check terminal output where you ran the command
- [ ] Try running: `react-native start --reset-cache`

**Backend**:
- [ ] Run `docker compose ps` to check services are running
- [ ] Run `make local-logs` to stream logs
- [ ] Check Docker is running: `docker ps`

### "Logs not updating"

- [ ] Press Ctrl+C to stop and restart: `make local-logs`
- [ ] Clear Docker logs: `docker compose logs --clear`
- [ ] Restart services: `make local-down && make local-up`

### "Too much spam in logs"

- [ ] Change `ACTIVE_LOG_LEVEL` to 'warn' or 'error'
- [ ] Use grep filter: `docker compose logs nakama | grep "error"`
- [ ] Use `--tail` flag: `docker compose logs --tail=50 nakama`

## Pro Tips

### Real-time Search
```bash
# Watch for specific events as they happen
make local-logs-nakama | grep --line-buffered "Player"
```

### Export Logs to File
```bash
# Save last 1000 lines to file
docker compose -f nakama/docker-compose.yml logs --tail=1000 > logs-export.txt

# Follow and save to file
docker compose -f nakama/docker-compose.yml logs -f nakama | tee backend.log
```

### Monitor Multiple Services
```bash
# Terminal 1: Backend logs
make local-logs

# Terminal 2: Frontend (browser DevTools)
npm run dev

# Terminal 3: Mobile (if needed)
react-native start
```

## Makefile Commands Summary

```bash
make local-up              # Start all services
make local-down            # Stop all services
make local-logs            # Stream all logs
make local-logs-nakama     # Stream Nakama only
make local-logs-postgres   # Stream PostgreSQL only
make local-logs-redis      # Stream Redis only
make frontend-dev          # Start frontend dev server
make check                 # Run tests (with logging)
```
