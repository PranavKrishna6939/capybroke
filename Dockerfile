# Multi-stage Dockerfile for Roast My Portfolio
# Builds both frontend and backend in a single container

# Stage 1: Build Go Backend
FROM golang:1.21-alpine AS backend-builder

WORKDIR /app/backend

# Install git for Go modules
RUN apk add --no-cache git

# Copy Go module files
COPY backend/go.mod backend/go.sum ./

# Download dependencies
RUN go mod download

# Copy backend source
COPY backend/ .

# Build the Go application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o portfolio-roast main.go

# Stage 2: Build Next.js Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN npm ci --production=false

# Copy source code (exclude backend to avoid conflicts)
COPY . .
RUN rm -rf backend

# Build the Next.js application
RUN npm run build

# Stage 3: Production Runtime
FROM node:18-alpine AS runtime

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata curl

# Create non-root user
RUN addgroup --system --gid 1001 appgroup
RUN adduser --system --uid 1001 --ingroup appgroup appuser

# Create necessary directories
RUN mkdir -p /app/backend/data /app/.next

# Copy backend binary from builder
COPY --from=backend-builder /app/backend/portfolio-roast /app/backend/
COPY --from=backend-builder /app/backend/data /app/backend/data

# Copy frontend build from builder
COPY --from=frontend-builder /app/.next/standalone ./
COPY --from=frontend-builder /app/.next/static ./.next/static
COPY --from=frontend-builder /app/public ./public

# Copy package.json for runtime
COPY --from=frontend-builder /app/package.json ./

# Create startup script
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh
set -e

echo "🚀 Starting Roast My Portfolio in Production..."

# Start backend in background
echo "🔧 Starting Go backend on port 8080..."
cd /app/backend
./portfolio-roast &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Start frontend
echo "🌐 Starting Next.js frontend on port 3000..."
cd /app
node server.js &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Trap signals
trap cleanup SIGINT SIGTERM

echo "✅ Services started successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8080"

# Wait for processes
wait
EOF

# Make startup script executable
RUN chmod +x /app/start.sh

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health && curl -f http://localhost:3000 || exit 1

# Start both services
CMD ["/app/start.sh"]
