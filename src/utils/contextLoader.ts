// Context Loader for Chat Assistant
// This module loads context files to provide personalized responses

import { spotifyService } from '../services/spotify';
import { malService } from '../services/myanimelist';
import { redditService } from '../services/reddit';

interface AnimeRecommendation {
    title: string;
    genre: string[];
    why: string;
    rating: number;
}

interface TechnicalSkills {
    languages: string[];
    frameworks: {
        frontend: string[];
        backend: string[];
        mobile: string[];
        data: string[];
    };
    databases: string[];
    cloud_services: {
        aws: string[];
        deployment: string[];
    };
    tools: string[];
    certifications: string[];
    specializations: string[];
}

interface ResumeData {
    name: string;
    title: string;
    summary: string;
    education: any;
    certifications: string[];
    experience: any[];
    projects: any[];
}

interface LiveSpotifyData {
    currentlyPlaying?: string;
    topTracks?: string[];
    topArtists?: string[];
    lastUpdated?: number;
}

interface LiveAnimeData {
    currentlyWatching?: string[];
    completedCount?: number;
    favoriteGenres?: string[];
    lastUpdated?: number;
}

interface LiveRedditData {
    trendingTopics?: string[];
    latestTheoryCount?: number;
    lastUpdated?: number;
}

interface ChatContext {
    animeRecommendations?: {
        recommendations: AnimeRecommendation[];
        favorites: string[];
        currently_watching: string[];
    };
    onePieceTheories?: string;
    spotifyRecommendations?: {
        playlists: string[];
        favorite_artists: string[];
        genres: string[];
    };
    technicalSkills?: TechnicalSkills;
    resume?: ResumeData;
    // Live API data
    liveSpotify?: LiveSpotifyData;
    liveAnime?: LiveAnimeData;
    liveReddit?: LiveRedditData;
}

export class ContextLoader {
    private context: ChatContext = {};
    private contextLoaded: boolean = false;
    private loadingPromise: Promise<ChatContext> | null = null;
    private cacheExpiry: number = 15 * 60 * 1000; // 15 minutes
    private lastLoadTime: number = 0;
    
    async loadContext(forceReload: boolean = false): Promise<ChatContext> {
        // Check if cache is still valid
        const now = Date.now();
        if (!forceReload && this.contextLoaded && (now - this.lastLoadTime) < this.cacheExpiry) {
            return this.context;
        }

        // Return existing loading promise if one is in progress
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        // Start new loading process
        this.loadingPromise = this.performLoad();
        
        try {
            const result = await this.loadingPromise;
            this.lastLoadTime = Date.now();
            return result;
        } finally {
            this.loadingPromise = null;
        }
    }

    private async performLoad(): Promise<ChatContext> {
        try {
            // Load all context files from public directory
            const contextFiles = [
                { path: '/chat_context/personal/anime_recommendations.json', key: 'animeRecommendations' },
                { path: '/chat_context/personal/one_piece_theories.md', key: 'onePieceTheories' },
                { path: '/chat_context/skills/technical_skills.json', key: 'technicalSkills' },
                { path: '/chat_context/resume/resume_text.json', key: 'resume' },
                { path: '/chat_context/personal/spotify_recommendations.json', key: 'spotifyRecommendations' }
            ];

            const loadPromises = contextFiles.map(async ({ path, key }) => {
                try {
                    const response = await fetch(path, {
                        // Add cache control headers
                        headers: {
                            'Cache-Control': 'max-age=900' // 15 minutes
                        }
                    });
                    
                    if (response.ok) {
                        const contentType = response.headers.get('content-type');
                        if (contentType?.includes('application/json')) {
                            const data = await response.json();
                            this.context[key as keyof ChatContext] = data;
                            console.log(`[ContextLoader] Loaded ${key}:`, Object.keys(data).slice(0, 3));
                        } else {
                            const text = await response.text();
                            this.context[key as keyof ChatContext] = text as any;
                            console.log(`[ContextLoader] Loaded ${key} (text):`, text.substring(0, 50) + '...');
                        }
                    } else {
                        console.warn(`[ContextLoader] Context file not found: ${path} (${response.status})`);
                    }
                } catch (error) {
                    console.error(`Failed to load ${path}:`, error);
                    // Continue loading other files even if one fails
                }
            });

            await Promise.all(loadPromises);
            
            // Load live API data if services are authenticated
            await this.loadLiveData();
            
            this.contextLoaded = true;
            console.log('[ContextLoader] Context loaded successfully:', Object.keys(this.context));
            console.log('[ContextLoader] Has resume?', !!this.context.resume);
            console.log('[ContextLoader] Has technical skills?', !!this.context.technicalSkills);
        } catch (error) {
            console.error('Error loading context:', error);
            // Return partial context even on error
        }

        return this.context;
    }

    private async loadLiveData(): Promise<void> {
        const liveDataPromises: Promise<void>[] = [];

        // Load Spotify data if authenticated
        if (spotifyService.isAuthenticated()) {
            liveDataPromises.push(this.loadSpotifyData());
        }

        // Load MAL data if authenticated
        if (malService.isAuthenticated()) {
            liveDataPromises.push(this.loadAnimeData());
        }

        // Always try to load Reddit data (no auth required)
        liveDataPromises.push(this.loadRedditData());

        // Load all live data in parallel
        await Promise.allSettled(liveDataPromises);
    }

    private async loadSpotifyData(): Promise<void> {
        try {
            const [current, topTracks, topArtists] = await Promise.all([
                spotifyService.getCurrentlyPlaying(),
                spotifyService.getTopTracks('short_term', 5),
                spotifyService.getTopArtists('short_term', 5)
            ]);

            this.context.liveSpotify = {
                currentlyPlaying: current?.is_playing && current.item 
                    ? spotifyService.formatTrackForChat(current.item)
                    : undefined,
                topTracks: topTracks.map(track => spotifyService.formatTrackForChat(track)),
                topArtists: topArtists.map(artist => spotifyService.formatArtistForChat(artist)),
                lastUpdated: Date.now()
            };
        } catch (error) {
            console.error('Failed to load Spotify data:', error);
        }
    }

    private async loadAnimeData(): Promise<void> {
        try {
            const [watching, completed] = await Promise.all([
                malService.getUserAnimeList('watching'),
                malService.getUserAnimeList('completed', 'list_score', 50)
            ]);

            // Extract favorite genres from completed anime
            const genreCount = new Map<string, number>();
            completed.forEach(anime => {
                anime.node.genres?.forEach(genre => {
                    genreCount.set(genre.name, (genreCount.get(genre.name) || 0) + 1);
                });
            });

            const favoriteGenres = Array.from(genreCount.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([genre]) => genre);

            this.context.liveAnime = {
                currentlyWatching: watching.map(anime => anime.node.title),
                completedCount: completed.length,
                favoriteGenres,
                lastUpdated: Date.now()
            };
        } catch (error) {
            console.error('Failed to load MAL data:', error);
        }
    }

    private async loadRedditData(): Promise<void> {
        try {
            const [topics, theories] = await Promise.all([
                redditService.getTrendingTheoryTopics(),
                redditService.getOnePieceTheories('hot', 'week')
            ]);

            this.context.liveReddit = {
                trendingTopics: topics,
                latestTheoryCount: theories.length,
                lastUpdated: Date.now()
            };
        } catch (error) {
            console.error('Failed to load Reddit data:', error);
        }
    }

    // Clear cache and force reload
    clearCache(): void {
        this.context = {};
        this.contextLoaded = false;
        this.lastLoadTime = 0;
        this.loadingPromise = null;
    }
    
    // Detect API needs from user query
    detectApiNeeds(query: string): { spotify: boolean; mal: boolean; reddit: boolean } {
        const lowerQuery = query.toLowerCase();
        const needs = {
            spotify: lowerQuery.includes('listening') || lowerQuery.includes('spotify') || 
                    lowerQuery.includes('music') || lowerQuery.includes('song') || 
                    lowerQuery.includes('artist') || lowerQuery.includes('track'),
            mal: lowerQuery.includes('anime') || lowerQuery.includes('watching') || 
                 lowerQuery.includes('mal') || lowerQuery.includes('myanimelist'),
            reddit: lowerQuery.includes('one piece') && 
                   (lowerQuery.includes('theor') || lowerQuery.includes('reddit') || 
                    lowerQuery.includes('latest') || lowerQuery.includes('trending'))
        };
        console.log('[ContextLoader] Detected API needs for query:', query, needs);
        return needs;
    }
    
    // Fetch live data on-demand based on query
    async fetchLiveDataForQuery(query: string): Promise<void> {
        const needs = this.detectApiNeeds(query);
        const promises: Promise<void>[] = [];
        
        if (needs.spotify && spotifyService.isAuthenticated()) {
            promises.push(this.loadSpotifyData());
        }
        
        if (needs.mal && malService.isAuthenticated()) {
            promises.push(this.loadAnimeData());
        }
        
        if (needs.reddit) {
            promises.push(this.loadRedditData());
        }
        
        if (promises.length > 0) {
            await Promise.allSettled(promises);
        }
    }
    
    getContextPrompt(userQuery?: string): string {
        let prompt = `CRITICAL: You are Faraz Alam's portfolio AI assistant. You MUST ALWAYS respond as Faraz's assistant, NEVER as a generic AI or programming assistant.

Your role: Help visitors learn about Faraz's background, skills, projects, and interests. You have access to his resume, technical skills, and personal interests.\n\n`;
        
        if (this.context.resume) {
            prompt += `Professional Background:\n`;
            prompt += `- ${this.context.resume.summary}\n`;
            prompt += `- Education: ${this.context.resume.education.degree} from ${this.context.resume.education.school}\n`;
            prompt += `- Certifications: ${this.context.resume.certifications.join(', ')}\n\n`;
        }
        
        if (this.context.technicalSkills) {
            prompt += `Technical Skills:\n`;
            prompt += `- Primary Languages: ${this.context.technicalSkills.languages.slice(0, 5).join(', ')}\n`;
            prompt += `- Backend: ${this.context.technicalSkills.frameworks.backend.join(', ')}\n`;
            prompt += `- Frontend: ${this.context.technicalSkills.frameworks.frontend.join(', ')}\n`;
            prompt += `- AWS Services: ${this.context.technicalSkills.cloud_services.aws.join(', ')}\n`;
            prompt += `- Specializations: ${this.context.technicalSkills.specializations.join(', ')}\n\n`;
        }

        prompt += `Personal Interests:\n`;
        
        if (this.context.animeRecommendations) {
            prompt += `- Favorite anime: ${this.context.animeRecommendations.favorites.join(', ')}\n`;
        }

        // Add live data to context
        if (this.context.liveSpotify) {
            prompt += `\nLive Spotify Data:\n`;
            if (this.context.liveSpotify.currentlyPlaying) {
                prompt += `- Currently playing: ${this.context.liveSpotify.currentlyPlaying}\n`;
            } else {
                prompt += `- Not currently playing anything\n`;
            }
            if (this.context.liveSpotify.topTracks?.length) {
                prompt += `- Top tracks (last 4 weeks):\n`;
                this.context.liveSpotify.topTracks.slice(0, 5).forEach((track, i) => {
                    prompt += `  ${i + 1}. ${track}\n`;
                });
            }
            if (this.context.liveSpotify.topArtists?.length) {
                prompt += `- Top artists (last 4 weeks):\n`;
                this.context.liveSpotify.topArtists.slice(0, 5).forEach((artist, i) => {
                    prompt += `  ${i + 1}. ${artist}\n`;
                });
            }
        }

        if (this.context.liveAnime) {
            if (this.context.liveAnime.currentlyWatching?.length) {
                prompt += `- Currently watching anime: ${this.context.liveAnime.currentlyWatching.join(', ')}\n`;
            }
            if (this.context.liveAnime.favoriteGenres?.length) {
                prompt += `- Favorite anime genres: ${this.context.liveAnime.favoriteGenres.join(', ')}\n`;
            }
        }

        if (this.context.liveReddit?.trendingTopics?.length) {
            prompt += `- Trending One Piece topics: ${this.context.liveReddit.trendingTopics.slice(0, 3).join(', ')}\n`;
        }

        if (this.context.onePieceTheories) {
            prompt += `- Has theories about One Piece anime\n`;
        }

        prompt += `\nREMEMBER: 
- You are on Faraz's portfolio website at fqa.info
- Always speak as Faraz's assistant, not as a generic AI
- Reference Faraz's actual background from the data above
- Be friendly and professional
- If asked about programming help, relate it back to Faraz's expertise\n\n`;
        
        // Add API availability status
        prompt += `API Connection Status:\n`;
        if (this.context.liveSpotify) {
            prompt += `- Spotify: Connected (you have access to current playing, top tracks, and top artists)\n`;
        } else {
            prompt += `- Spotify: Not connected (suggest clicking ⚙️ button to connect)\n`;
        }
        
        if (this.context.liveAnime) {
            prompt += `- MyAnimeList: Connected (you have access to watching and completed anime)\n`;
        } else {
            prompt += `- MyAnimeList: Not connected (suggest clicking ⚙️ button to connect)\n`;
        }
        
        prompt += `- Reddit: Always available (you can fetch One Piece theories anytime)\n\n`;
        
        // Add static data summary if no live data
        if (!this.context.liveSpotify && this.context.spotifyRecommendations) {
            prompt += `Faraz's music taste (from profile): ${this.context.spotifyRecommendations.favorite_artists.join(', ')}\n`;
        }
        if (!this.context.liveAnime && this.context.animeRecommendations) {
            prompt += `Faraz's favorite anime: ${this.context.animeRecommendations.favorites.join(', ')}\n`;
        }
        prompt += `\n`;
        
        prompt += `When users ask about Spotify, anime, or Reddit data:\n`;
        prompt += `- If connected: Use the live data provided in the context above\n`;
        prompt += `- If not connected: Suggest they connect via the ⚙️ settings button\n`;
        prompt += `- For Reddit: You can mention you can fetch the latest theories\n\n`;
        
        if (userQuery) {
            prompt += `User question: ${userQuery}`;
        }
        
        return prompt;
    }

    getFullContext(): ChatContext {
        return this.context;
    }
}

// Export singleton instance
export const contextLoader = new ContextLoader();