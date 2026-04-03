# Multi-stage Docker build for LILA Frontend
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_NAKAMA_HOST=localhost
ARG VITE_NAKAMA_PORT=7350
ARG VITE_NAKAMA_SSL=false
ARG VITE_NAKAMA_KEY=lila-tictactoe-server-key

ENV VITE_NAKAMA_HOST=$VITE_NAKAMA_HOST
ENV VITE_NAKAMA_PORT=$VITE_NAKAMA_PORT
ENV VITE_NAKAMA_SSL=$VITE_NAKAMA_SSL
ENV VITE_NAKAMA_KEY=$VITE_NAKAMA_KEY

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
