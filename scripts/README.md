# Portfolio Scripts

This directory contains utility scripts for managing the portfolio application.

## Available Scripts

### deploy-fresh.sh
Performs a fresh deployment to GitHub Pages:
```bash
./deploy-fresh.sh
```

This script:
- Builds the production version
- Deploys to GitHub Pages
- Ensures CNAME file is included for custom domain

### update-context.sh
Updates chat context files:
```bash
./update-context.sh
```

This interactive script helps you:
- Update resume information
- Modify technical skills
- Update personal interests (anime, music)
- Manage chat context data

## Production Deployment

The portfolio uses environment-based configuration for the chat system:

1. Copy `.env.production.example` to `.env.production`
2. Configure your preferred chat API (OpenAI, Claude, or custom)
3. Run `npm run deploy` to deploy to GitHub Pages

## Chat Context Files

The AI assistant uses context files from `/chat_context/`:
- `resume/resume_text.json` - Professional experience
- `skills/technical_skills.json` - Technical capabilities
- `personal/anime_recommendations.json` - Anime preferences
- `personal/spotify_recommendations.json` - Music preferences