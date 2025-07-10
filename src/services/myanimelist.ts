import { apiUsageTracker } from '../utils/apiUsageTracker';

interface MALConfig {
  clientId: string;
  redirectUri: string;
}

interface MALToken {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

interface Anime {
  node: {
    id: number;
    title: string;
    main_picture?: {
      medium: string;
      large: string;
    };
    alternative_titles?: {
      synonyms: string[];
      en: string;
      ja: string;
    };
    start_date?: string;
    end_date?: string;
    synopsis?: string;
    mean?: number;
    rank?: number;
    popularity?: number;
    num_list_users?: number;
    num_scoring_users?: number;
    nsfw?: string;
    genres?: Array<{
      id: number;
      name: string;
    }>;
    status?: string;
    num_episodes?: number;
    source?: string;
    studios?: Array<{
      id: number;
      name: string;
    }>;
  };
  list_status?: {
    status: AnimeStatus;
    score: number;
    num_episodes_watched: number;
    is_rewatching: boolean;
    updated_at: string;
  };
}

export type AnimeStatus = 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';

interface AnimeListResponse {
  data: Anime[];
  paging: {
    next?: string;
    previous?: string;
  };
}

interface UserProfile {
  id: number;
  name: string;
  picture?: string;
  gender?: string;
  birthday?: string;
  location?: string;
  joined_at?: string;
  anime_statistics?: {
    num_items_watching: number;
    num_items_completed: number;
    num_items_on_hold: number;
    num_items_dropped: number;
    num_items_plan_to_watch: number;
    num_items: number;
    num_days_watched: number;
    num_days_watching: number;
    num_days_completed: number;
    num_days_on_hold: number;
    num_days_dropped: number;
    num_days: number;
    num_episodes: number;
    num_times_rewatched: number;
    mean_score: number;
  };
}

export class MyAnimeListService {
  private config: MALConfig;
  private tokenKey = 'mal_token';
  private codeVerifierKey = 'mal_code_verifier';
  private stateKey = 'mal_auth_state';
  private cacheKey = 'mal_cache';
  private cacheExpiry = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_MAL_CLIENT_ID || '',
      redirectUri: import.meta.env.VITE_MAL_REDIRECT_URI || `${window.location.origin}/mal-callback`
    };
  }

  // PKCE flow utilities (similar to Spotify)
  private generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], '');
  }

  // Authentication methods
  async authorize(): Promise<void> {
    const codeVerifier = this.generateRandomString(128);
    const state = this.generateRandomString(16);

    // Store for later use
    localStorage.setItem(this.codeVerifierKey, codeVerifier);
    localStorage.setItem(this.stateKey, state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      state: state,
      redirect_uri: this.config.redirectUri,
      code_challenge: codeVerifier,
      code_challenge_method: 'plain'
    });

    window.location.href = `https://myanimelist.net/v1/oauth2/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<boolean> {
    const savedState = localStorage.getItem(this.stateKey);
    const codeVerifier = localStorage.getItem(this.codeVerifierKey);

    if (!savedState || savedState !== state || !codeVerifier) {
      console.error('Invalid state or missing code verifier');
      return false;
    }

    try {
      const response = await fetch('https://myanimelist.net/v1/oauth2/token', {
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

      const token: MALToken = await response.json();
      token.expires_at = Date.now() + (token.expires_in * 1000);
      
      localStorage.setItem(this.tokenKey, JSON.stringify(token));
      localStorage.removeItem(this.codeVerifierKey);
      localStorage.removeItem(this.stateKey);

      apiUsageTracker.recordRequest(true, Date.now() - Date.now(), 0);
      
      return true;
    } catch (error) {
      console.error('Error handling MAL callback:', error);
      apiUsageTracker.recordRequest(false, Date.now() - Date.now(), 0, (error as Error).message);
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    const tokenData = this.getStoredToken();
    if (!tokenData?.refresh_token) {
      return false;
    }

    try {
      const response = await fetch('https://myanimelist.net/v1/oauth2/token', {
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

      const newToken: MALToken = await response.json();
      newToken.expires_at = Date.now() + (newToken.expires_in * 1000);
      
      localStorage.setItem(this.tokenKey, JSON.stringify(newToken));
      return true;
    } catch (error) {
      console.error('Error refreshing MAL token:', error);
      return false;
    }
  }

  private getStoredToken(): MALToken | null {
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
    localStorage.removeItem(this.cacheKey);
  }

  // Cache utilities
  private getCachedData<T>(key: string): T | null {
    const cacheStr = localStorage.getItem(this.cacheKey);
    if (!cacheStr) return null;

    try {
      const cache = JSON.parse(cacheStr);
      const item = cache[key];
      
      if (item && item.expires > Date.now()) {
        return item.data;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  private setCachedData<T>(key: string, data: T): void {
    const cacheStr = localStorage.getItem(this.cacheKey);
    const cache = cacheStr ? JSON.parse(cacheStr) : {};
    
    cache[key] = {
      data,
      expires: Date.now() + this.cacheExpiry
    };
    
    localStorage.setItem(this.cacheKey, JSON.stringify(cache));
  }

  // API methods
  private async apiRequest<T>(endpoint: string, options: globalThis.RequestInit = {}): Promise<T | null> {
    const token = await this.getValidToken();
    if (!token) {
      throw new Error('No valid MAL token available');
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(`https://api.myanimelist.net/v2${endpoint}`, {
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
        throw new Error(`MAL API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      apiUsageTracker.recordRequest(true, Date.now() - startTime, 1);
      return data;
    } catch (error) {
      apiUsageTracker.recordRequest(false, Date.now() - startTime, 0, (error as Error).message);
      console.error('MAL API request failed:', error);
      return null;
    }
  }

  async getUserProfile(): Promise<UserProfile | null> {
    const cached = this.getCachedData<UserProfile>('user_profile');
    if (cached) return cached;

    const data = await this.apiRequest<UserProfile>('/users/@me?fields=anime_statistics');
    if (data) {
      this.setCachedData('user_profile', data);
    }
    return data;
  }

  async getUserAnimeList(
    status?: AnimeStatus,
    sort?: 'list_score' | 'list_updated_at' | 'anime_title' | 'anime_start_date',
    limit: number = 100
  ): Promise<Anime[]> {
    const cacheKey = `anime_list_${status || 'all'}_${sort || 'default'}`;
    const cached = this.getCachedData<Anime[]>(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      fields: 'list_status,alternative_titles,main_picture,synopsis,mean,genres,status,num_episodes,studios',
      limit: limit.toString()
    });

    if (status) params.append('status', status);
    if (sort) params.append('sort', sort);

    const data = await this.apiRequest<AnimeListResponse>(`/users/@me/animelist?${params.toString()}`);
    const animeList = data?.data || [];
    
    if (animeList.length > 0) {
      this.setCachedData(cacheKey, animeList);
    }
    
    return animeList;
  }

  async getAnimeDetails(animeId: number): Promise<Anime | null> {
    const cacheKey = `anime_${animeId}`;
    const cached = this.getCachedData<Anime>(cacheKey);
    if (cached) return cached;

    const data = await this.apiRequest<Anime>(
      `/anime/${animeId}?fields=alternative_titles,main_picture,synopsis,mean,rank,popularity,genres,status,num_episodes,source,studios`
    );
    
    if (data) {
      this.setCachedData(cacheKey, data);
    }
    
    return data;
  }

  async searchAnime(query: string, limit: number = 10): Promise<Anime[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      fields: 'alternative_titles,main_picture,synopsis,mean,genres'
    });

    const data = await this.apiRequest<AnimeListResponse>(`/anime?${params.toString()}`);
    return data?.data || [];
  }

  // Utility methods for chat integration
  formatAnimeForChat(anime: Anime): string {
    const title = anime.node.title;
    const score = anime.node.mean ? ` (Score: ${anime.node.mean}/10)` : '';
    const episodes = anime.node.num_episodes ? ` - ${anime.node.num_episodes} episodes` : '';
    const status = anime.list_status ? ` [${this.formatStatus(anime.list_status.status)}]` : '';
    
    return `${title}${score}${episodes}${status}`;
  }

  formatStatus(status: AnimeStatus): string {
    const statusMap = {
      'watching': 'Currently Watching',
      'completed': 'Completed',
      'on_hold': 'On Hold',
      'dropped': 'Dropped',
      'plan_to_watch': 'Plan to Watch'
    };
    return statusMap[status] || status;
  }

  getAnimeUrl(animeId: number): string {
    return `https://myanimelist.net/anime/${animeId}`;
  }

  async getRecommendations(): Promise<string[]> {
    // Get user's completed anime with high scores
    const completed = await this.getUserAnimeList('completed', 'list_score', 50);
    const highRated = completed
      .filter(anime => anime.list_status && anime.list_status.score >= 8)
      .map(anime => anime.node.title);
    
    return highRated.slice(0, 10);
  }
}

// Export singleton instance
export const malService = new MyAnimeListService();