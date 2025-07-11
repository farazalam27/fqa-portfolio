#!/bin/bash
# Setup permanent Cloudflare tunnel for Ollama

set -e

echo "Setting up permanent Cloudflare tunnel..."

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "cloudflared not found. Installing..."
    brew install cloudflare/cloudflare/cloudflared
fi

# Check if jq is installed (needed for JSON parsing)
if ! command -v jq &> /dev/null; then
    echo "jq not found. Installing..."
    brew install jq
fi

# Login to Cloudflare (opens browser)
echo "Logging into Cloudflare..."
cloudflared tunnel login

# Create tunnel
TUNNEL_NAME="fqa-ollama"
echo "Creating tunnel: $TUNNEL_NAME"
cloudflared tunnel create $TUNNEL_NAME || echo "Tunnel might already exist"

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list --name $TUNNEL_NAME --output json | jq -r '.[0].id')

if [ -z "$TUNNEL_ID" ]; then
    echo "Error: Could not get tunnel ID"
    exit 1
fi

echo "Tunnel ID: $TUNNEL_ID"

# Create config file
CONFIG_FILE="$HOME/.cloudflared/fqa-ollama.yml"
echo "Creating config file: $CONFIG_FILE"

cat > "$CONFIG_FILE" << EOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json

ingress:
  - service: http://localhost:11434
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
      httpHostHeader: "localhost:11434"
      originServerName: "localhost"
EOF

# Get the tunnel domain
TUNNEL_DOMAIN="${TUNNEL_ID}.cfargotunnel.com"

echo ""
echo "==========================================="
echo "Permanent tunnel created!"
echo "Domain: https://$TUNNEL_DOMAIN"
echo "==========================================="
echo ""
echo "To run the tunnel:"
echo "cloudflared tunnel --config $CONFIG_FILE run"
echo ""
echo "Or use the start script:"
echo "./scripts/start-permanent-tunnel.sh"

# Create a start script for the permanent tunnel
cat > "./scripts/start-permanent-tunnel.sh" << 'SCRIPT'
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
SCRIPT

chmod +x ./scripts/start-permanent-tunnel.sh

# Update .env.production with permanent URL
echo ""
echo "Updating .env.production with permanent tunnel URL..."
sed -i '' "s|VITE_OLLAMA_URL=.*|VITE_OLLAMA_URL=https://$TUNNEL_DOMAIN|" .env.production

echo ""
echo "Setup complete! Your permanent tunnel URL is:"
echo "https://$TUNNEL_DOMAIN"
echo ""
echo "This URL will never change, even after restarts."