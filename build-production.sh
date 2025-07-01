#!/bin/bash

# Production build script for Roast My Portfolio
set -e

echo "Building Roast My Portfolio for Production..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm ci --production=false

# Build the frontend
echo "Building Next.js frontend..."
npm run build

# Build the Go backend
echo "Building Go backend..."
cd backend

# Install Go dependencies
echo "Installing Go dependencies..."
go mod tidy

# Build the Go binary
echo "Building Go binary..."
go build -o portfolio-roast-prod main.go

# Make sure data directory exists
mkdir -p data

cd ..

echo "Build completed successfully!"
echo ""
echo "Build artifacts:"
echo "   Frontend: .next/ directory"
echo "   Backend:  backend/portfolio-roast-prod"
echo ""
echo "Ready for deployment!"
