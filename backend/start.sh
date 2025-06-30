#!/bin/bash

# Exit on any error
set -e

echo "Starting Roast My Portfolio Application..."

# Function to cleanup background processes
cleanup() {
    echo "Shutting down services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        wait $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        wait $FRONTEND_PID 2>/dev/null || true
    fi
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "Error: Go is not installed. Please install Go to run the backend."
    exit 1
fi

# Check if Node.js/npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js to run the frontend."
    exit 1
fi

# Change to backend directory
cd backend

# Install Go dependencies if needed
echo "Installing Go dependencies..."
go mod tidy

# Start the backend server
echo "Starting Go backend server on :8080..."
go run main.go &
BACKEND_PID=$!

# Give backend time to start
sleep 2

# Change back to root directory
cd ..

# Install frontend dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start the frontend server
echo "Starting Next.js frontend server on :3000..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Services started successfully!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8080"
echo "Health:   http://localhost:8080/health"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user input
wait
