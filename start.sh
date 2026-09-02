#!/bin/bash
# CareerMail - Local Development Starter (Without Docker)

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=================================================="
echo "🚀 Starting CareerMail Services (Without Docker)..."
echo "=================================================="

# Function to clean up background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down CareerMail services..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# 1. Start Backend
echo "📦 Starting FastAPI Backend on http://localhost:8080..."
cd "$ROOT_DIR/backend"
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi
.venv/bin/python run.py &
BACKEND_PID=$!

# 2. Start Frontend
echo "💻 Starting Vite Frontend on http://localhost:5173..."
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!

cd "$ROOT_DIR"

echo ""
echo "=================================================="
echo "✅ CareerMail is running!"
echo "👉 Frontend URL:     http://localhost:5173"
echo "👉 Backend API:      http://localhost:8080"
echo "👉 API Swagger Docs: http://localhost:8080/docs"
echo "👉 Demo Account:     akarshan@email.com / password123"
echo "=================================================="
echo "Press Ctrl+C to stop all services."
echo ""

wait
