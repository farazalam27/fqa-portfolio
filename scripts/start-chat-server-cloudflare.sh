#!/bin/bash

# Start Ollama Chat Server with Cloudflare Tunnel
# Alternative to ngrok - no account needed

echo "🚀 Starting Faraz's AI Chat Server (Cloudflare Tunnel)..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found. Please install with: brew install --cask ollama"
    exit 1
fi

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared not found. Installing..."
    brew install cloudflare/cloudflare/cloudflared
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

# Start Cloudflare tunnel
echo "🌐 Starting Cloudflare tunnel..."
echo "📝 This will generate a temporary public URL..."

# Run cloudflared and capture output
cloudflared tunnel --url http://localhost:11434 2>&1 | tee cloudflare.log &
CF_PID=$!

# Wait and extract URL
sleep 5
CF_URL=$(grep -o 'https://.*\.trycloudflare\.com' cloudflare.log | head -1)

if [ -z "$CF_URL" ]; then
    echo "⏳ Waiting for tunnel URL..."
    sleep 5
    CF_URL=$(grep -o 'https://.*\.trycloudflare\.com' cloudflare.log | head -1)
fi

if [ -z "$CF_URL" ]; then
    echo "❌ Failed to get Cloudflare tunnel URL"
    kill $CF_PID 2>/dev/null
    exit 1
fi

# Save PIDs and URL for stop script
echo "$OLLAMA_PID" > .ollama.pid
echo "$CF_PID" > .cloudflare.pid
echo "$CF_URL" > .tunnel.url

# Update .env file with the URL
echo "VITE_OLLAMA_URL=$CF_URL" > ../.env.local

echo "✅ Chat server is running!"
echo "🔗 Public URL: $CF_URL"
echo "📝 URL saved to .env.local"
echo ""
echo "⚠️  Note: Cloudflare URLs are temporary and change on restart"
echo "To stop the server, run: ./stop-chat-server.sh"