#!/usr/bin/env bash
# =============================================================================
# deploy.sh — One-shot deployment script for LILA Tic-Tac-Toe
# Usage: ./deploy.sh [--host YOUR_IP] [--key YOUR_SERVER_KEY]
# =============================================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
SERVER_HOST="${SERVER_HOST:-localhost}"
NAKAMA_SERVER_KEY="${NAKAMA_SERVER_KEY:-lila-tictactoe-server-key-CHANGE-ME}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(openssl rand -base64 24)}"
NAKAMA_HTTP_KEY="${NAKAMA_HTTP_KEY:-$(openssl rand -base64 24)}"
NAKAMA_CONSOLE_USERNAME="${NAKAMA_CONSOLE_USERNAME:-admin}"
NAKAMA_CONSOLE_PASSWORD="${NAKAMA_CONSOLE_PASSWORD:-$(openssl rand -base64 24)}"
NAKAMA_CONSOLE_SIGNING_KEY="${NAKAMA_CONSOLE_SIGNING_KEY:-$(openssl rand -hex 32)}"
NAKAMA_SESSION_ENCRYPTION_KEY="${NAKAMA_SESSION_ENCRYPTION_KEY:-$(openssl rand -hex 32)}"
NAKAMA_REFRESH_ENCRYPTION_KEY="${NAKAMA_REFRESH_ENCRYPTION_KEY:-$(openssl rand -hex 32)}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[LILA]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
err()  { echo -e "${RED}[ERR]${NC} $1"; exit 1; }

docker_compose() {
  if command -v docker >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    err "Docker Compose not found. Install Docker Desktop or docker-compose."
  fi
}

# ── Parse args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --host) SERVER_HOST="$2"; shift 2 ;;
    --key)  NAKAMA_SERVER_KEY="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

log "Deploying LILA Tic-Tac-Toe to $SERVER_HOST"

# ── Step 1: Build TypeScript modules ─────────────────────────────────────────
log "Building Nakama TypeScript modules..."
cd "$PROJECT_ROOT/nakama/data/modules"
if ! command -v npx &>/dev/null; then err "npx not found. Install Node.js 20+"; fi
npm install --silent
npm run build
ok "TypeScript modules built → build/index.js"

# ── Step 2: Start production stack ───────────────────────────────────────────
log "Starting production Docker stack..."
cd "$PROJECT_ROOT/deploy"
export SERVER_HOST
POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
NAKAMA_SERVER_KEY="$NAKAMA_SERVER_KEY" \
NAKAMA_HTTP_KEY="$NAKAMA_HTTP_KEY" \
NAKAMA_CONSOLE_USERNAME="$NAKAMA_CONSOLE_USERNAME" \
NAKAMA_CONSOLE_PASSWORD="$NAKAMA_CONSOLE_PASSWORD" \
NAKAMA_CONSOLE_SIGNING_KEY="$NAKAMA_CONSOLE_SIGNING_KEY" \
NAKAMA_SESSION_ENCRYPTION_KEY="$NAKAMA_SESSION_ENCRYPTION_KEY" \
NAKAMA_REFRESH_ENCRYPTION_KEY="$NAKAMA_REFRESH_ENCRYPTION_KEY" \
SERVER_HOST="$SERVER_HOST" \
docker_compose -f "$PROJECT_ROOT/deploy/docker-compose.prod.yml" up -d --build

log "Waiting for Nakama to initialize (30s)..."
sleep 30

# Health check
for i in {1..10}; do
  if curl -sf "http://localhost:7350/" >/dev/null 2>&1; then
    ok "Nakama is healthy"; break
  fi
  [ $i -eq 10 ] && err "Nakama failed to start. Check: docker compose logs nakama"
  sleep 5
done

# ── Step 3: Wait for frontend ────────────────────────────────────────────────
log "Waiting for frontend container..."
sleep 5

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  LILA Deployment Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo "  Nakama API:     http://$SERVER_HOST:7350"
echo "  Nakama Console: http://$SERVER_HOST:7351"
echo "  Frontend:       http://$SERVER_HOST"
echo ""
echo "  View logs with:"
echo "  docker compose -f deploy/docker-compose.prod.yml logs -f"
echo ""
echo "  Server Key: $NAKAMA_SERVER_KEY"
echo "  HTTP Key: $NAKAMA_HTTP_KEY"
echo "  DB Password: $POSTGRES_PASSWORD"
echo "  Console User: $NAKAMA_CONSOLE_USERNAME"
echo "  Console Pass: $NAKAMA_CONSOLE_PASSWORD"
echo ""
echo -e "${RED}⚠  Save the above credentials securely!${NC}"
