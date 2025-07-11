# Setting Up a Permanent Cloudflare Tunnel

## Why Permanent Tunnel?
- Free quick tunnels change URL every time they restart
- Permanent tunnels keep the same domain forever
- Still completely FREE with a Cloudflare account

## Setup Steps

### 1. Create a Cloudflare Account (Free)
1. Go to https://dash.cloudflare.com/sign-up
2. Create a free account

### 2. Install and Authenticate
```bash
# If not already installed
brew install cloudflare/cloudflare/cloudflared

# Login to Cloudflare
cloudflared tunnel login
```
This opens your browser to authenticate.

### 3. Create a Named Tunnel
```bash
cloudflared tunnel create ollama-fqa
```
This creates a permanent tunnel and saves credentials.

### 4. Create Configuration File
Create `~/.cloudflared/config.yml`:
```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /Users/<YOUR-USERNAME>/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: ollama-fqa.yourdomain.com
    service: http://localhost:11434
  - service: http_status:404
```

### 5. Route the Tunnel

#### Option A: Use Cloudflare's Domain (Easiest)
```bash
# This gives you a permanent subdomain like:
# https://ollama-fqa.cfargotunnel.com
cloudflared tunnel route dns ollama-fqa
```

#### Option B: Use Your Own Domain
If you own a domain in Cloudflare:
```bash
cloudflared tunnel route dns ollama-fqa ollama.yourdomain.com
```

### 6. Run the Tunnel
```bash
cloudflared tunnel run ollama-fqa
```

Your tunnel will always be available at the same URL!

## Quick Setup Script

Save this as `permanent-tunnel-setup.sh`:
```bash
#!/bin/bash

# Login (only needed once)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create ollama-fqa

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list --name ollama-fqa --output json | jq -r '.[0].id')

# Create config
cat > ~/.cloudflared/ollama-fqa.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json

ingress:
  - service: http://localhost:11434
    originRequest:
      noTLSVerify: true
EOF

echo "Tunnel created! ID: $TUNNEL_ID"
echo "To run: cloudflared tunnel --config ~/.cloudflared/ollama-fqa.yml run"
```

## Alternative: Free ngrok with Fixed Subdomain

1. Sign up at https://ngrok.com (free)
2. Get your auth token
3. Run:
```bash
ngrok config add-authtoken YOUR_TOKEN
ngrok http 11434 --domain=your-subdomain.ngrok-free.app
```

The free tier gives you one fixed subdomain!

## Recommended: Use Cloudflare Pages Instead

Since you're already using GitHub Pages, consider:
1. Connect your GitHub repo to Cloudflare Pages
2. Get automatic HTTPS and better performance
3. Use Cloudflare Tunnels with your Pages domain

This would give you:
- Free hosting on Cloudflare's network
- Permanent tunnel URL
- Better integration