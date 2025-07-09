# Ollama Chat Setup (Simplified)

This directory contains simple utilities for managing your chat context.

## Setup

1. **Install Ollama**:
   ```bash
   brew install --cask ollama
   ```

2. **Pull the llama3.2 model** (better than mistral):
   ```bash
   ollama pull llama3.2
   ```

3. **Start Ollama**:
   ```bash
   ollama serve
   ```

4. **Configure your portfolio**:
   - By default, the chat uses `http://localhost:11434`
   - To expose Ollama on your network:
     1. Open Ollama app settings
     2. Enable network access
     3. Update `.env.local` with your IP:
        ```
        VITE_OLLAMA_URL=http://YOUR_IP:11434
        ```

## How It Works

- When Ollama is running locally, the chatbot uses llama3.2 model
- If Ollama is offline, the chat shows mock responses
- All context files in `chat_context/` are loaded automatically

## Updating Context

Use the `update-context.sh` script to easily manage your chat context files:
```bash
./update-context.sh
```

## Testing

1. Make sure Ollama is running: `ollama serve`
2. Start dev server: `npm run dev`
3. Visit http://localhost:5173
4. Click the chat bubble and test!

The AI now has context about your:
- Professional experience (Java, Spring Boot, Python, PySpark, AWS)
- Projects and technical skills
- Personal interests (anime, music)