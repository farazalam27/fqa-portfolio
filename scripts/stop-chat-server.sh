#!/bin/bash

# Stop Ollama Chat Server
# This script stops the Ollama server and ngrok tunnel

echo "🛑 Stopping Faraz's AI Chat Server..."

# Read PIDs
if [ -f .ollama.pid ]; then
    OLLAMA_PID=$(cat .ollama.pid)
    if kill -0 $OLLAMA_PID 2>/dev/null; then
        # Check if this PID is actually Ollama before killing
        if ps -p $OLLAMA_PID -o comm= | grep -q "ollama"; then
            read -p "⚠️  Stop Ollama server? This may affect other apps using it (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                kill $OLLAMA_PID
                echo "✅ Ollama server stopped"
            else
                echo "⏩ Skipped stopping Ollama server"
            fi
        fi
    fi
    rm .ollama.pid
fi

if [ -f .ngrok.pid ]; then
    NGROK_PID=$(cat .ngrok.pid)
    if kill -0 $NGROK_PID 2>/dev/null; then
        kill $NGROK_PID
        echo "✅ ngrok tunnel stopped"
    fi
    rm .ngrok.pid
fi

# Check for Cloudflare tunnel
if [ -f .cloudflare.pid ]; then
    CF_PID=$(cat .cloudflare.pid)
    if kill -0 $CF_PID 2>/dev/null; then
        kill $CF_PID
        echo "✅ Cloudflare tunnel stopped"
    fi
    rm .cloudflare.pid
fi

# Clean up files
rm -f .ngrok.url .tunnel.url ngrok.log cloudflare.log

echo "🎯 All services stopped!"