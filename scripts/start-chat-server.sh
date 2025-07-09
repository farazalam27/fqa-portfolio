#!/bin/bash

# Start Ollama Chat Server
# This script starts the Ollama server and exposes it via ngrok

echo "🚀 Starting Faraz's AI Chat Server..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found. Please install with: brew install --cask ollama"
    exit 1
fi

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found. Please install with: brew install ngrok"
    exit 1
fi

# Check if ngrok is configured with authtoken
if ! ngrok config check >/dev/null 2>&1; then
    echo "❌ ngrok requires authentication. Please follow these steps:"
    echo "1. Sign up for a free account at: https://dashboard.ngrok.com/signup"
    echo "2. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "3. Run: ngrok config add-authtoken YOUR_AUTH_TOKEN"
    echo ""
    echo "Alternative: Use Cloudflare Tunnel instead (no account needed for quick tests)"
    exit 1
fi

# Check if Ollama is already running
if lsof -Pi :11434 -sTCP:LISTEN -t >/dev/null ; then
    echo "🔄 Ollama is already running on port 11434"
    OLLAMA_PID=$(lsof -Pi :11434 -sTCP:LISTEN -t)
    echo "✅ Using existing Ollama server (PID: $OLLAMA_PID)"
else
    # Start Ollama server in background
    echo "📦 Starting Ollama server..."
    ollama serve &
    OLLAMA_PID=$!
    echo "✅ Ollama server started (PID: $OLLAMA_PID)"
    # Wait for Ollama to start
    sleep 3
fi

# Make sure the model is loaded
echo "🤖 Loading Mistral model..."
ollama run mistral < /dev/null &> /dev/null &

# Check if ngrok is already running on port 4040
if lsof -Pi :4040 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Stopping existing ngrok process..."
    pkill -f "ngrok http"
    sleep 2
fi

# Start ngrok tunnel
echo "🌐 Starting ngrok tunnel..."
ngrok http 11434 --log-level=info --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 5

# Extract ngrok URL with retry
RETRY_COUNT=0
MAX_RETRIES=3
NGROK_URL=""

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ -z "$NGROK_URL" ]; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)
    if [ -z "$NGROK_URL" ]; then
        echo "⏳ Waiting for ngrok to start... (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)"
        sleep 2
        RETRY_COUNT=$((RETRY_COUNT + 1))
    fi
done

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL after $MAX_RETRIES attempts"
    echo "Check ngrok.log for errors"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

# Save PIDs and URL for stop script
echo "$OLLAMA_PID" > .ollama.pid
echo "$NGROK_PID" > .ngrok.pid
echo "$NGROK_URL" > .ngrok.url

# Update .env file with the ngrok URL
echo "VITE_OLLAMA_URL=$NGROK_URL" > ../.env.local

echo "✅ Chat server is running!"
echo "🔗 Public URL: $NGROK_URL"
echo "📝 URL saved to .env.local"
echo ""
echo "To stop the server, run: ./stop-chat-server.sh"