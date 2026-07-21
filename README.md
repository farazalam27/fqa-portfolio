# farazqalam.com - Personal Portfolio Website

A modern, responsive portfolio website built with React 19 and Tailwind CSS 4. Features an AI-powered chat assistant with real-time API integrations for Spotify, MyAnimeList, and Reddit.

## 🌟 Features

- **Responsive Design**: Looks great on all devices from mobile to desktop
- **Modern UI**: Clean, minimalist design with smooth animations
- **Interactive Sections**:
  - Home: Introduction and quick navigation
  - About: Personal information and skills
  - Projects: Showcase of my work with links
  - Contact: Form to get in touch
- **AI Chat Widget**: Interactive assistant powered by Ollama/OpenAI that can:
  - Answer questions about my experience and skills
  - Show what I'm currently listening to on Spotify
  - Display my anime watching list from MyAnimeList
  - Fetch latest One Piece theories from Reddit
- **API Integrations**: OAuth 2.0 with PKCE for Spotify and MyAnimeList
- **Social Media Integration**: Links to LinkedIn and GitHub profiles

## 🛠️ Technologies Used

- **React 19**: Latest React with TypeScript
- **Tailwind CSS 4**: Modern CSS framework with Vite plugin
- **Vite**: Fast development and optimized builds
- **EmailJS**: Contact form functionality
- **Ollama/OpenAI**: AI chat capabilities
- **GitHub Pages**: Deployment with custom domain

## 🚀 Quick Start

### Development Setup

```bash
# Clone the repository
git clone https://github.com/farazalam27/fqa-portfolio.git
cd fqa-portfolio

# Install dependencies
npm install

# Copy environment variables
cp .env.development.example .env.development

# Start development server
npm run dev
```

### Production Deployment

```bash
# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy

# Or use the cache-busting deploy script
./scripts/deploy-fresh.sh
```

## 🔧 Configuration

### Chat API Setup

The chat supports multiple providers:

1. **Local Ollama** (Development):
   - Install Ollama: `brew install ollama`
   - Run: `ollama serve`
   - Chat will automatically connect to `localhost:11434`

2. **Production with Ollama**:
   - Set up Cloudflare Tunnel (see `scripts/start-permanent-tunnel.sh`)
   - Update `VITE_OLLAMA_URL` in `.env.production`

3. **OpenAI** (Alternative):
   - Set `VITE_USE_OPENAI=true`
   - Add your API key to environment variables

### API Integrations

#### Spotify Setup
1. Create app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Add redirect URIs:
   - Development: `http://localhost:5173/spotify-callback`
   - Production: `https://farazqalam.com/spotify-callback`
3. Add Client ID to `.env` files

#### MyAnimeList Setup
1. Register app at [MAL API Config](https://myanimelist.net/apiconfig)
2. Add redirect URLs:
   - Development: `http://localhost:5173/mal-callback`
   - Production: `https://farazqalam.com/mal-callback`
3. Add Client ID to `.env` files

#### Reddit API
No setup needed! Uses public JSON feeds.

## 📁 Project Structure

```
fqa-portfolio/
├── chat_context/       # AI assistant context files
│   ├── personal/       # Personal interests data
│   ├── resume/         # Professional information
│   └── skills/         # Technical skills
├── public/             # Static assets
├── scripts/            # Utility scripts
├── src/
│   ├── components/     # React components
│   │   ├── sections/   # Page sections (Home, About, etc.)
│   │   ├── ChatWidget.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── ChatSettings.tsx
│   │   └── OAuthCallback.tsx
│   ├── services/       # API service layers
│   │   ├── spotify.ts
│   │   ├── myanimelist.ts
│   │   └── reddit.ts
│   ├── utils/          # Utility functions
│   └── config/         # Configuration files
├── .env.development    # Development environment
├── .env.production     # Production environment
└── vite.config.ts      # Vite configuration
```

## 🤖 Chat Commands

Once APIs are connected via the settings (⚙️) button:

### Spotify Commands
- "What's Faraz listening to?"
- "Show his top tracks"
- "What are his top artists?"

### Anime Commands
- "What anime is he watching?"
- "Show his completed anime"
- "What are his favorite anime?"

### Reddit Commands
- "Latest One Piece theories"
- "Trending theories about Gear 5"
- "Search theories about Joyboy"

## 🔒 Security Notes

- Uses OAuth 2.0 with PKCE flow (no client secrets needed)
- Tokens stored in localStorage with auto-refresh
- All API calls are client-side (no backend required)
- Environment variables are safe to expose (only Client IDs)

## 📞 Contact

- Website: [farazqalam.com](https://farazqalam.com)
- LinkedIn: [linkedin.com/in/fqalam](https://www.linkedin.com/in/fqalam)
- GitHub: [github.com/farazalam27](https://www.github.com/farazalam27)

## 🔍 Troubleshooting

### Chat Issues
- **"Too cheap" message**: Ollama server is offline or tunnel not running
- **API not connecting**: Check redirect URIs match exactly in API dashboards
- **Cache issues**: Use `./scripts/deploy-fresh.sh` for cache-busting deployment

### Development Issues
- **TypeScript errors**: Run `npm run lint` to check
- **Build failures**: Delete `node_modules` and `npm install` again
- **Port conflicts**: Ollama uses 11434, dev server uses 5173

---

Made with ❤️ by Faraz Alam
