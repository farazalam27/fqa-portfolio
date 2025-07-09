import { apiUsageTracker } from '../utils/apiUsageTracker';

interface SpotifyConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  expires_at?: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string; id: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  external_urls: {
    spotify: string;
  };
  preview_url?: string;
  duration_ms: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: Array<{ url: string; height: number; width: number }>;
  external_urls: {
    spotify: string;
  };
  followers: {
    total: number;
  };
}

interface CurrentlyPlaying {
  is_playing: boolean;
  item: SpotifyTrack | null;
  progress_ms?: number;
  timestamp?: number;
}

interface TopTracksResponse {
  items: SpotifyTrack[];
  total: number;
  limit: number;
  offset: number;
}

interface TopArtistsResponse {
  items: SpotifyArtist[];
  total: number;
  limit: number;
  offset: number;
}

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export class SpotifyService {
  private config: SpotifyConfig;
  private tokenKey = 'spotify_token';
  private codeVerifierKey = 'spotify_code_verifier';
  private stateKey = 'spotify_auth_state';

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
      redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || `${window.location.origin}/spotify-callback`,
      scopes: [
        'user-read-currently-playing',
        'user-read-playback-state',
        'user-top-read',
        'user-read-recently-played',
        'user-library-read'
      ]
    };
  }

  // PKCE flow utilities
  private generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], '');
  }

  private async sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return crypto.subtle.digest('SHA-256', data);
  }

  private base64encode(input: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  // Authentication methods
  async authorize(): Promise<void> {
    const codeVerifier = this.generateRandomString(128);
    const hashed = await this.sha256(codeVerifier);
    const codeChallenge = this.base64encode(hashed);
    const state = this.generateRandomString(16);

    // Store for later use
    localStorage.setItem(this.codeVerifierKey, codeVerifier);
    localStorage.setItem(this.stateKey, state);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      state: state,
      scope: this.config.scopes.join(' '),
      code_challenge_method: 'S256',
      code_challenge: codeChallenge
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<boolean> {
    const savedState = localStorage.getItem(this.stateKey);
    const codeVerifier = localStorage.getItem(this.codeVerifierKey);

    if (!savedState || savedState !== state || !codeVerifier) {
      console.error('Invalid state or missing code verifier');
      return false;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.config.redirectUri,
          code_verifier: codeVerifier
        })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const token: SpotifyToken = await response.json();
      token.expires_at = Date.now() + (token.expires_in * 1000);
      
      localStorage.setItem(this.tokenKey, JSON.stringify(token));
      localStorage.removeItem(this.codeVerifierKey);
      localStorage.removeItem(this.stateKey);

      apiUsageTracker.trackRequest('spotify', true, Date.now() - Date.now(), 0);
      
      return true;
    } catch (error) {
      console.error('Error handling Spotify callback:', error);
      apiUsageTracker.trackRequest('spotify', false, Date.now() - Date.now(), 0, error as Error);
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    const tokenData = this.getStoredToken();
    if (!tokenData?.refresh_token) {
      return false;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          grant_type: 'refresh_token',
          refresh_token: tokenData.refresh_token
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const newToken: SpotifyToken = await response.json();
      newToken.expires_at = Date.now() + (newToken.expires_in * 1000);
      newToken.refresh_token = newToken.refresh_token || tokenData.refresh_token;
      
      localStorage.setItem(this.tokenKey, JSON.stringify(newToken));
      return true;
    } catch (error) {
      console.error('Error refreshing Spotify token:', error);
      return false;
    }
  }

  private getStoredToken(): SpotifyToken | null {
    const tokenStr = localStorage.getItem(this.tokenKey);
    if (!tokenStr) return null;
    
    try {
      return JSON.parse(tokenStr);
    } catch {
      return null;
    }
  }

  async getValidToken(): Promise<string | null> {
    const token = this.getStoredToken();
    if (!token) return null;

    // Check if token is expired or about to expire (5 minutes buffer)
    if (token.expires_at && token.expires_at < Date.now() + 300000) {
      const refreshed = await this.refreshToken();
      if (!refreshed) return null;
      
      const newToken = this.getStoredToken();
      return newToken?.access_token || null;
    }

    return token.access_token;
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.codeVerifierKey);
    localStorage.removeItem(this.stateKey);
  }

  // API methods
  private async apiRequest<T>(endpoint: string, options: globalThis.RequestInit = {}): Promise<T | null> {
    const token = await this.getValidToken();
    if (!token) {
      throw new Error('No valid Spotify token available');
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token once
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.apiRequest<T>(endpoint, options);
          }
        }
        throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      apiUsageTracker.trackRequest('spotify', true, Date.now() - startTime, 1);
      return data;
    } catch (error) {
      apiUsageTracker.trackRequest('spotify', false, Date.now() - startTime, 0, error as Error);
      console.error('Spotify API request failed:', error);
      return null;
    }
  }

  async getCurrentlyPlaying(): Promise<CurrentlyPlaying | null> {
    const data = await this.apiRequest<any>('/me/player/currently-playing');
    if (!data) return null;

    return {
      is_playing: data.is_playing || false,
      item: data.item,
      progress_ms: data.progress_ms,
      timestamp: data.timestamp
    };
  }

  async getTopTracks(timeRange: TimeRange = 'short_term', limit: number = 20): Promise<SpotifyTrack[]> {
    const data = await this.apiRequest<TopTracksResponse>(
      `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
    );
    return data?.items || [];
  }

  async getTopArtists(timeRange: TimeRange = 'short_term', limit: number = 20): Promise<SpotifyArtist[]> {
    const data = await this.apiRequest<TopArtistsResponse>(
      `/me/top/artists?time_range=${timeRange}&limit=${limit}`
    );
    return data?.items || [];
  }

  async getRecentlyPlayed(limit: number = 20): Promise<SpotifyTrack[]> {
    const data = await this.apiRequest<any>('/me/player/recently-played?limit=' + limit);
    return data?.items?.map((item: any) => item.track) || [];
  }

  // Utility methods for chat integration
  formatTrackForChat(track: SpotifyTrack): string {
    const artists = track.artists.map(a => a.name).join(', ');
    return `${track.name} by ${artists}`;
  }

  formatArtistForChat(artist: SpotifyArtist): string {
    const genres = artist.genres.slice(0, 3).join(', ');
    return `${artist.name}${genres ? ` (${genres})` : ''}`;
  }

  generateSpotifyEmbed(trackId: string): string {
    return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;
  }

  getTimeRangeLabel(timeRange: TimeRange): string {
    const labels = {
      'short_term': 'Last 4 weeks',
      'medium_term': 'Last 6 months',
      'long_term': 'All time'
    };
    return labels[timeRange];
  }
}

// Export singleton instance
export const spotifyService = new SpotifyService();