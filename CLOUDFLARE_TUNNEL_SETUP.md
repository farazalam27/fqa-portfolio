# Cloudflare Tunnel Setup for Ollama

This guide explains how to expose your local Ollama instance to the internet for free using Cloudflare Tunnel.

## Prerequisites
- Ollama installed and running locally
- Ollama configured to allow network connections
- A Cloudflare account (free)

## Setup Steps

### 1. Install Cloudflare Tunnel (cloudflared)

**macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Linux:**
```bash
# Download the latest release
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**Windows:**
Download from: https://github.com/cloudflare/cloudflared/releases

### 2. Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This will open your browser to authenticate with your Cloudflare account.

### 3. Create a Tunnel

```bash
cloudflared tunnel create ollama-tunnel
```

This creates a tunnel and generates credentials.

### 4. Create Configuration File

**Option A: In your project directory (Recommended)**
Create `fqa-portfolio/.cloudflared/config.yml`:

```yaml
url: http://localhost:11434
tunnel: <YOUR-TUNNEL-ID>
credentials-file: .cloudflared/<TUNNEL-ID>.json
```

Then run the tunnel from your project directory:
```bash
cd /path/to/fqa-portfolio
cloudflared tunnel run ollama-tunnel
```

**Option B: Global configuration**
Create `~/.cloudflared/config.yml`:

```yaml
url: http://localhost:11434
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /Users/<YOUR-USERNAME>/.cloudflared/<TUNNEL-ID>.json
```

### 5. Route the Tunnel

You have two options:

**Option A: Use a Cloudflare subdomain (Quick & Free)**
```bash
cloudflared tunnel route dns ollama-tunnel faraz-ollama.yourdomain.com
```

**Option B: Use Cloudflare's temporary domain**
```bash
# Just run the tunnel, it will give you a URL like:
# https://random-name.trycloudflare.com
cloudflared tunnel run ollama-tunnel
```

### 6. Start the Tunnel

```bash
cloudflared tunnel run ollama-tunnel
```

You'll see output like:
```
2024-01-10T10:00:00Z INF Tunnel accessible at https://faraz-ollama.yourdomain.com
```

### 7. Update Your Environment File

Edit `.env.production`:
```env
VITE_OLLAMA_URL=https://faraz-ollama.yourdomain.com
```

## Running Ollama + Tunnel Automatically

### macOS/Linux Script

Create `start-ollama-tunnel.sh`:
```bash
#!/bin/bash
# Start Ollama if not running
if ! pgrep -x "ollama" > /dev/null; then
    ollama serve &
    sleep 5
fi

# Start Cloudflare tunnel
cloudflared tunnel run ollama-tunnel
```

Make it executable:
```bash
chmod +x start-ollama-tunnel.sh
```

### Quick One-Time Tunnel (Testing)

For testing without setup:
```bash
cloudflared tunnel --url http://localhost:11434
```

This gives you a temporary URL that changes each time.

## Security Notes

- The tunnel exposes your Ollama to the internet
- Cloudflare provides DDoS protection
- Consider adding authentication if needed
- Monitor your usage to ensure no abuse

## Troubleshooting

1. **Ollama not accessible**: Make sure Ollama is running with network access:
   ```bash
   OLLAMA_HOST=0.0.0.0:11434 ollama serve
   ```

2. **Tunnel won't start**: Check if port 11434 is accessible:
   ```bash
   curl http://localhost:11434
   ```

3. **Connection timeouts**: Ensure your firewall allows outbound HTTPS connections

## Alternative: ngrok

If you prefer ngrok:
```bash
# Install ngrok
brew install ngrok

# Expose Ollama
ngrok http 11434
```

Update `.env.production` with the ngrok URL.