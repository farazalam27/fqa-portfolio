# API Setup Guide

This guide explains how to set up the external API integrations for the portfolio chat system.

## Prerequisites

Before setting up the APIs, ensure you have:
- A Spotify Developer account
- A MyAnimeList account
- Basic understanding of OAuth 2.0 flow

## Spotify API Setup

1. **Create a Spotify App**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Click "Create App"
   - Fill in the app details:
     - App name: "FQA Portfolio Chat"
     - App description: "Portfolio chat integration"
     - Redirect URIs:
       - Development: `http://localhost:5173/spotify-callback`
       - Production: `https://fqa.info/spotify-callback`
   - Select "Web API" for the APIs used
   - Agree to the terms and create the app

2. **Get Your Credentials**
   - In your app settings, find your `Client ID`
   - Note: Client Secret is NOT needed (we use PKCE flow)

3. **Configure Environment Variables**
   ```bash
   # Development (.env.development)
   VITE_SPOTIFY_CLIENT_ID=your_client_id_here
   VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/spotify-callback

   # Production (.env.production)
   VITE_SPOTIFY_CLIENT_ID=your_client_id_here
   VITE_SPOTIFY_REDIRECT_URI=https://fqa.info/spotify-callback
   ```

## MyAnimeList API Setup

1. **Register Your Application**
   - Go to [MyAnimeList API Config](https://myanimelist.net/apiconfig)
   - Click "Create ID"
   - Fill in the application details:
     - App Name: "FQA Portfolio"
     - App Type: "Web"
     - App Description: "Portfolio chat anime integration"
     - App Redirect URL:
       - Development: `http://localhost:5173/mal-callback`
       - Production: `https://fqa.info/mal-callback`
     - Homepage URL: `https://fqa.info`
   - Submit and wait for approval (usually instant)

2. **Get Your Credentials**
   - Once approved, you'll receive a `Client ID`
   - Note: Client Secret is NOT needed (we use PKCE flow)

3. **Configure Environment Variables**
   ```bash
   # Development (.env.development)
   VITE_MAL_CLIENT_ID=your_client_id_here
   VITE_MAL_REDIRECT_URI=http://localhost:5173/mal-callback

   # Production (.env.production)
   VITE_MAL_CLIENT_ID=your_client_id_here
   VITE_MAL_REDIRECT_URI=https://fqa.info/mal-callback
   ```

## Reddit API

The Reddit integration uses public JSON feeds and doesn't require authentication. No setup needed!

## Testing the Integrations

### Local Development

1. Copy `.env.development.example` to `.env.development`
2. Add your API credentials
3. Run `npm run dev`
4. Test the chat commands:
   - "What am I listening to?" (Spotify)
   - "Show my anime list" (MAL)
   - "Latest One Piece theories" (Reddit)

### Production Deployment

1. Set environment variables in your deployment platform:
   - For GitHub Pages: Use GitHub Secrets
   - For Vercel/Netlify: Use their environment variable settings
   - For custom hosting: Set in your server configuration

2. Ensure redirect URIs match exactly what's configured in the API dashboards

## Chat Commands

Once configured, users can use these commands:

### Spotify Commands
- "What am I listening to?"
- "What's currently playing on Spotify?"
- "Show my top tracks"
- "Show my top artists"

### Anime Commands
- "What anime am I watching?"
- "Show my completed anime"
- "Search for [anime name]"
- "Anime recommendations"

### Reddit Commands
- "Latest One Piece theories"
- "Trending One Piece theories"
- "One Piece theories about Gear 5"
- "Search theories about [topic]"

## Troubleshooting

### OAuth Redirect Issues
- Ensure redirect URIs match EXACTLY (including trailing slashes)
- Check that you're using the correct environment variables
- Verify the app is approved (for MAL)

### API Rate Limits
- Spotify: 180 requests per minute
- MyAnimeList: Variable, but generous for authenticated requests
- Reddit: 60 requests per minute (unauthenticated)

### CORS Issues
- The app uses proper OAuth flows to avoid CORS
- Reddit API is accessed directly (allows CORS)
- If issues persist, consider using a backend proxy

## Security Notes

1. **Never commit API keys to version control**
2. **Use environment variables for all sensitive data**
3. **The app uses PKCE flow for enhanced security**
4. **Tokens are stored in localStorage (consider alternatives for production)**
5. **Consider implementing token refresh on the backend for production**

## Future Enhancements

Consider these improvements for production:
1. Backend proxy for token management
2. Secure token storage (httpOnly cookies)
3. User account system for persistent connections
4. Analytics for API usage
5. Fallback when APIs are unavailable