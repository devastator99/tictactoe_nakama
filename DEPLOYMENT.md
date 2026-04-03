# Deployment Guide

This document captures the assignment-ready AWS deployment path for the LILA multiplayer Tic-Tac-Toe project.

## Recommended architecture

- EC2 Ubuntu 22.04 instance for Nakama, Postgres, and the frontend container
- Docker Compose for the production stack
- Elastic IP for a stable public endpoint

This repository already includes:

- production compose file: `deploy/docker-compose.prod.yml`
- one-shot helper script: `deploy.sh`
- production env template: `deploy/.env.example`
- local workflow shortcuts: `Makefile`

## 1. Create the EC2 instance

Use these settings:

- instance type: `t2.micro` or `t3.micro`
- AMI: Ubuntu Server 22.04 LTS
- storage: default is enough for the assignment
- Elastic IP: allocate and associate it after launch

Security group inbound rules:

- `22` from your IP for SSH
- `80` from `0.0.0.0/0` for the frontend
- `443` from `0.0.0.0/0` if you later add HTTPS
- `7350` from `0.0.0.0/0` for Nakama API and WebSocket traffic
- `7351` from your IP or `0.0.0.0/0` for the Nakama console

Recommended AWS housekeeping:

- enable billing alerts
- keep the console port restricted if possible

## 2. Install Docker on Ubuntu 22.04

SSH in:

```bash
ssh -i /path/to/key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

Install Docker:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

## 3. Copy the project to EC2

From your local machine:

```bash
rsync -avz --exclude node_modules --exclude dist --exclude build \
  -e "ssh -i /path/to/key.pem" \
  /path/to/LIVA/ ubuntu@YOUR_EC2_PUBLIC_IP:~/LIVA
```

Then on EC2:

```bash
cd ~/LIVA
chmod +x deploy.sh
```

## 4. Deploy the production stack

Optionally create a deploy env file first:

```bash
cp deploy/.env.example deploy/.env
```

Then either edit the values in `deploy/.env` or export them in your shell before starting the stack.

Run:

```bash
./deploy.sh --host YOUR_EC2_PUBLIC_IP --key YOUR_SERVER_KEY
```

What this does:

1. builds the Nakama TypeScript runtime bundle
2. starts Postgres, Nakama, and the frontend with `deploy/docker-compose.prod.yml`
3. bakes the frontend with the correct Nakama host and server key

Required production values:

- `SERVER_HOST`
- `POSTGRES_PASSWORD`
- `NAKAMA_SERVER_KEY`
- `NAKAMA_HTTP_KEY`
- `NAKAMA_CONSOLE_PASSWORD`
- `NAKAMA_CONSOLE_SIGNING_KEY`
- `NAKAMA_SESSION_ENCRYPTION_KEY`
- `NAKAMA_REFRESH_ENCRYPTION_KEY`

The production compose file now fails fast if these values are missing.

Expected public endpoints:

- frontend: `http://YOUR_EC2_PUBLIC_IP`
- Nakama API / WebSocket: `http://YOUR_EC2_PUBLIC_IP:7350`
- Nakama console: `http://YOUR_EC2_PUBLIC_IP:7351`

## 5. Verify the deployment

Backend health check:

```bash
curl http://YOUR_EC2_PUBLIC_IP:7350/
```

You should receive `HTTP/1.1 200 OK` with an empty body from Nakama.

Container checks:

```bash
docker compose -f deploy/docker-compose.prod.yml ps
docker compose -f deploy/docker-compose.prod.yml logs -f
```

Frontend check:

- open `http://YOUR_EC2_PUBLIC_IP`
- login in two browser sessions
- test quick match
- test private room flow
- complete a game and verify leaderboard changes

Recommended pre-deploy local check:

```bash
make check
make smoke
```

`make smoke` exercises quick match, private rooms, gameplay, leaderboard, and player stats against the running local Nakama stack.

## 6. Optional: S3 + CloudFront frontend hosting

This is possible, but there is one important caveat:

- if CloudFront serves the frontend over HTTPS, the browser will expect secure API/WebSocket traffic too

That means you should proxy Nakama behind HTTPS/WSS on `443` before calling the setup production-ready in the browser.

Build for S3 upload:

```bash
cd frontend
VITE_NAKAMA_HOST=YOUR_EC2_PUBLIC_IP \
VITE_NAKAMA_PORT=7350 \
VITE_NAKAMA_SSL=false \
VITE_NAKAMA_KEY=YOUR_SERVER_KEY \
npm run build
```

Upload the generated `frontend/dist/` contents to S3.

## 7. Troubleshooting

### Frontend connects to `localhost`

Rebuild with the EC2 public IP or domain:

```bash
cd frontend
VITE_NAKAMA_HOST=YOUR_EC2_PUBLIC_IP \
VITE_NAKAMA_PORT=7350 \
VITE_NAKAMA_SSL=false \
VITE_NAKAMA_KEY=YOUR_SERVER_KEY \
npm run build
```

### WebSocket or match join fails

- check EC2 security group rules for `7350`
- confirm the browser is calling your public EC2 host, not `localhost`
- inspect Nakama logs:

```bash
docker compose -f deploy/docker-compose.prod.yml logs -f nakama
```

### Containers do not start

Use:

```bash
docker compose -f deploy/docker-compose.prod.yml ps
docker compose -f deploy/docker-compose.prod.yml logs
```

If Nakama exits during startup, rebuild the runtime bundle first:

```bash
cd nakama/data/modules
npm test
```

### HTTPS frontend cannot reach backend

This is usually mixed-content blocking. Put Nakama behind HTTPS/WSS on `443`, then rebuild the frontend with:

```bash
VITE_NAKAMA_SSL=true
VITE_NAKAMA_PORT=443
```

## 8. Submission prep

Before sending the assignment:

- update `README.md` with your real GitHub repo URL
- replace placeholder URLs with your real EC2 or domain endpoints
- include the live frontend URL
- include the Nakama endpoint
- mention bonus features you implemented
- optionally record a short demo video
