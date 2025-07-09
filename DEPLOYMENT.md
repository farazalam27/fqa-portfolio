# Deployment Guide

## Production Deployment Setup

This portfolio is configured for deployment to GitHub Pages with a custom domain (fqa.info).

### Prerequisites

- Node.js 18+ installed
- GitHub repository with Pages enabled
- Custom domain configured (optional)

### Environment Configuration

1. Copy `.env.production.example` to `.env.production`
2. Configure your chat API settings:
   - For OpenAI: Set `VITE_USE_OPENAI=true` and add your API key
   - For custom API: Set your endpoint URL and authentication
   - Without API: The chat will use mock responses

### Build and Deploy

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

### Custom Domain Setup

The CNAME file is automatically copied during build. Ensure your domain DNS is configured:
- A record pointing to GitHub Pages IPs
- CNAME record for www subdomain

### Chat Context Files

The following context files power the AI assistant:
- `/chat_context/resume/resume_text.json` - Professional information
- `/chat_context/skills/technical_skills.json` - Technical skills
- `/chat_context/personal/anime_recommendations.json` - Personal interests
- `/chat_context/personal/spotify_recommendations.json` - Music preferences

### Production Features

1. **Chat System**: 
   - Supports OpenAI API or custom endpoints
   - Falls back to mock responses if no API configured
   - Context-aware responses based on resume and skills

2. **Performance**:
   - Optimized build with Vite
   - Lazy loading for better initial load
   - Tailwind CSS 4 for minimal CSS bundle

3. **Contact Form**:
   - EmailJS integration (already configured)
   - No backend required

### Monitoring

- Check GitHub Actions for deployment status
- Monitor chat API usage if configured
- Review analytics for user engagement

### Updating Content

1. **Projects**: Edit `/src/components/sections/Projects.tsx`
2. **Skills**: Update both `/src/components/sections/About.tsx` and `/chat_context/skills/technical_skills.json`
3. **Resume**: Update `/chat_context/resume/resume_text.json`
4. **Chat Context**: Update files in `/chat_context/` directory

### Troubleshooting

- **Chat not working**: Check API configuration in environment variables
- **CNAME issues**: Ensure file exists in `/public/CNAME`
- **Build errors**: Run `npm run lint` to check for TypeScript issues