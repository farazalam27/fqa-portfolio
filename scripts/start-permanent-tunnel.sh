#!/bin/bash
# Start Ollama and permanent Cloudflare tunnel

echo "Starting Ollama with CORS enabled..."
pkill ollama 2>/dev/null
OLLAMA_ORIGINS="https://fqa.info,https://*.cfargotunnel.com,http://localhost:5173" OLLAMA_HOST=0.0.0.0:11434 ollama serve > ollama.log 2>&1 &
sleep 3

echo "Starting permanent Cloudflare tunnel..."
pkill cloudflared 2>/dev/null
cloudflared tunnel --config ~/.cloudflared/fqa-ollama.yml run &

echo ""
echo "Services started!"
echo "Tunnel URL: https://$(cloudflared tunnel list --name fqa-ollama --output json | jq -r '.[0].id').cfargotunnel.com"
echo ""
echo "Press Ctrl+C to stop both services"

# Keep script running and show logs
tail -f ollama.log
