#!/bin/bash
# Start Ollama and Cloudflare tunnel for production chat

echo "Starting Ollama with CORS enabled..."
pkill ollama 2>/dev/null
OLLAMA_ORIGINS="https://fqa.info,http://localhost:5173" OLLAMA_HOST=0.0.0.0:11434 ollama serve > ollama.log 2>&1 &
sleep 3

echo "Starting Cloudflare tunnel..."
pkill cloudflared 2>/dev/null
cloudflared tunnel --url http://localhost:11434 > tunnel.log 2>&1 &
sleep 5

# Extract and display the tunnel URL
TUNNEL_URL=$(grep "Your quick Tunnel has been created" tunnel.log -A 1 | grep "https://" | awk '{print $2}')
echo ""
echo "=========================================="
echo "Tunnel URL: $TUNNEL_URL"
echo "=========================================="
echo ""
echo "To use this URL in production:"
echo "1. Update VITE_OLLAMA_URL in .env.production"
echo "2. Run: npm run deploy"
echo ""
echo "Press Ctrl+C to stop both services"

# Keep script running
tail -f tunnel.log