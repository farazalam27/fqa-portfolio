import React, { useState, useEffect, useRef } from 'react';
import type { JSX } from 'react';
import { contextLoader } from '../utils/contextLoader';
import { createApiClient, ApiClient, ApiError, RateLimitError, ChatMessage } from '../utils/api';
import { spotifyService } from '../services/spotify';
import { malService } from '../services/myanimelist';
import { redditService } from '../services/reddit';

interface ChatWindowProps {
    onClose: () => void;
    className: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    metadata?: {
        type?: 'spotify' | 'anime' | 'reddit' | 'text';
        data?: any;
    };
}

interface CommandMatch {
    type: 'spotify' | 'anime' | 'reddit' | null;
    action: string;
    query?: string;
}

export default function ChatWindow({ onClose, className }: ChatWindowProps): JSX.Element {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hey! I'm Faraz's assistant. Ask me anything about him - his projects, skills, experience, or even anime recommendations! I can also show you what he's listening to on Spotify, his anime list, or the latest One Piece theories!" }
    ]);
    const [input, setInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [messageCount, setMessageCount] = useState<number>(0);
    const [contextPrompt, setContextPrompt] = useState<string>('');
    
    // API client reference
    const apiClientRef = useRef<ApiClient | null>(null);
    const maxMessages = 20;

    // Initialize API client and load context on mount
    useEffect(() => {
        const initializeChat = async () => {
            // Create API client
            const client = createApiClient();
            if (!client) {
                console.warn('API client could not be created. Check your environment configuration.');
            }
            apiClientRef.current = client;
            
            // Load context
            await contextLoader.loadContext();
            setContextPrompt(contextLoader.getContextPrompt());
        };
        initializeChat();
        
        // Cleanup on unmount
        return () => {
            apiClientRef.current?.cancelRequest();
        };
    }, []);

    // Detect API-specific commands
    const detectCommand = (text: string): CommandMatch => {
        const lowerText = text.toLowerCase();
        
        // Spotify commands
        if (lowerText.includes('listening to') || lowerText.includes('currently playing') || lowerText.includes('spotify')) {
            if (lowerText.includes('currently') || lowerText.includes('now') || lowerText.includes('listening to')) {
                return { type: 'spotify', action: 'current' };
            }
            if (lowerText.includes('top') && (lowerText.includes('song') || lowerText.includes('track'))) {
                return { type: 'spotify', action: 'top_tracks' };
            }
            if (lowerText.includes('top') && lowerText.includes('artist')) {
                return { type: 'spotify', action: 'top_artists' };
            }
            return { type: 'spotify', action: 'general' };
        }
        
        // Anime/MAL commands
        if (lowerText.includes('anime') || lowerText.includes('mal') || lowerText.includes('myanimelist')) {
            if (lowerText.includes('watching') || lowerText.includes('currently')) {
                return { type: 'anime', action: 'watching' };
            }
            if (lowerText.includes('completed') || lowerText.includes('finished')) {
                return { type: 'anime', action: 'completed' };
            }
            if (lowerText.includes('recommend')) {
                return { type: 'anime', action: 'recommendations' };
            }
            if (lowerText.includes('search')) {
                const searchMatch = text.match(/search\s+(?:for\s+)?(.+?)(?:\s+anime)?$/i);
                return { type: 'anime', action: 'search', query: searchMatch?.[1] };
            }
            return { type: 'anime', action: 'list' };
        }
        
        // Reddit/One Piece theory commands
        if (lowerText.includes('one piece') && (lowerText.includes('theor') || lowerText.includes('reddit'))) {
            if (lowerText.includes('latest') || lowerText.includes('recent') || lowerText.includes('new')) {
                return { type: 'reddit', action: 'latest' };
            }
            if (lowerText.includes('trending') || lowerText.includes('popular') || lowerText.includes('hot')) {
                return { type: 'reddit', action: 'trending' };
            }
            if (lowerText.includes('about')) {
                const aboutMatch = text.match(/about\s+(.+?)(?:\s+theor)?/i);
                return { type: 'reddit', action: 'search', query: aboutMatch?.[1] };
            }
            return { type: 'reddit', action: 'general' };
        }
        
        return { type: null, action: '' };
    };

    // Handle Spotify API calls
    const handleSpotifyCommand = async (action: string): Promise<Message> => {
        if (!spotifyService.isAuthenticated()) {
            return {
                role: 'assistant',
                content: "I'd love to show you Faraz's Spotify data, but you need to connect your Spotify account first. Would you like me to help you connect?",
                metadata: { type: 'spotify' }
            };
        }

        try {
            switch (action) {
                case 'current': {
                    const current = await spotifyService.getCurrentlyPlaying();
                    if (current?.is_playing && current.item) {
                        const track = current.item;
                        return {
                            role: 'assistant',
                            content: `Faraz is currently listening to: **${spotifyService.formatTrackForChat(track)}**\n\n[Open in Spotify](${track.external_urls.spotify})`,
                            metadata: { type: 'spotify', data: track }
                        };
                    } else {
                        return {
                            role: 'assistant',
                            content: "Faraz isn't listening to anything on Spotify right now. But I can show you his recent tracks or top songs!",
                            metadata: { type: 'spotify' }
                        };
                    }
                }
                
                case 'top_tracks': {
                    const tracks = await spotifyService.getTopTracks('short_term', 5);
                    if (tracks.length > 0) {
                        const trackList = tracks.map((track, i) => 
                            `${i + 1}. ${spotifyService.formatTrackForChat(track)}`
                        ).join('\n');
                        return {
                            role: 'assistant',
                            content: `Here are Faraz's top tracks from the last 4 weeks:\n\n${trackList}`,
                            metadata: { type: 'spotify', data: tracks }
                        };
                    }
                    break;
                }
                
                case 'top_artists': {
                    const artists = await spotifyService.getTopArtists('short_term', 5);
                    if (artists.length > 0) {
                        const artistList = artists.map((artist, i) => 
                            `${i + 1}. ${spotifyService.formatArtistForChat(artist)}`
                        ).join('\n');
                        return {
                            role: 'assistant',
                            content: `Here are Faraz's top artists from the last 4 weeks:\n\n${artistList}`,
                            metadata: { type: 'spotify', data: artists }
                        };
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Spotify command error:', error);
        }

        return {
            role: 'assistant',
            content: "I had trouble fetching Spotify data. Try asking about Faraz's music taste from his profile instead!",
            metadata: { type: 'spotify' }
        };
    };

    // Handle MAL API calls
    const handleAnimeCommand = async (action: string, query?: string): Promise<Message> => {
        if (!malService.isAuthenticated()) {
            return {
                role: 'assistant',
                content: "To see Faraz's live anime list, you'll need to connect to MyAnimeList. For now, here are his favorite anime: One Piece and Attack on Titan!",
                metadata: { type: 'anime' }
            };
        }

        try {
            switch (action) {
                case 'watching': {
                    const watching = await malService.getUserAnimeList('watching');
                    if (watching.length > 0) {
                        const animeList = watching.slice(0, 5).map((anime, i) => 
                            `${i + 1}. ${malService.formatAnimeForChat(anime)}`
                        ).join('\n');
                        return {
                            role: 'assistant',
                            content: `Faraz is currently watching:\n\n${animeList}`,
                            metadata: { type: 'anime', data: watching }
                        };
                    } else {
                        return {
                            role: 'assistant',
                            content: "Faraz isn't watching any anime right now, but he's always looking for new recommendations!",
                            metadata: { type: 'anime' }
                        };
                    }
                }
                
                case 'completed': {
                    const completed = await malService.getUserAnimeList('completed', 'list_score', 10);
                    if (completed.length > 0) {
                        const animeList = completed.map((anime, i) => 
                            `${i + 1}. ${malService.formatAnimeForChat(anime)}`
                        ).join('\n');
                        return {
                            role: 'assistant',
                            content: `Here are some of Faraz's completed anime (sorted by score):\n\n${animeList}`,
                            metadata: { type: 'anime', data: completed }
                        };
                    }
                    break;
                }
                
                case 'search': {
                    if (query) {
                        const results = await malService.searchAnime(query, 5);
                        if (results.length > 0) {
                            const animeList = results.map((anime, i) => 
                                `${i + 1}. ${malService.formatAnimeForChat(anime)}`
                            ).join('\n');
                            return {
                                role: 'assistant',
                                content: `Here are anime matching "${query}":\n\n${animeList}`,
                                metadata: { type: 'anime', data: results }
                            };
                        }
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('MAL command error:', error);
        }

        // Fallback to static data
        const context = contextLoader.getFullContext();
        if (context.animeRecommendations) {
            const favorites = context.animeRecommendations.favorites.join(', ');
            return {
                role: 'assistant',
                content: `Based on Faraz's profile, his favorite anime include: ${favorites}. He especially loves One Piece for its epic world-building and Attack on Titan for its intense plot twists!`,
                metadata: { type: 'anime' }
            };
        }

        return {
            role: 'assistant',
            content: "I couldn't fetch the anime data right now, but Faraz loves shounen anime, especially One Piece!",
            metadata: { type: 'anime' }
        };
    };

    // Handle Reddit API calls
    const handleRedditCommand = async (action: string, query?: string): Promise<Message> => {
        try {
            switch (action) {
                case 'latest': {
                    const theories = await redditService.getOnePieceTheories('new', 'week');
                    if (theories.length > 0) {
                        const theoryList = theories.slice(0, 5).map((post, i) => 
                            `${i + 1}. ${redditService.formatPostForChat(post)}`
                        ).join('\n\n');
                        return {
                            role: 'assistant',
                            content: `Here are the latest One Piece theories from r/OnePiece:\n\n${theoryList}`,
                            metadata: { type: 'reddit', data: theories }
                        };
                    }
                    break;
                }
                
                case 'trending': {
                    const theories = await redditService.getOnePieceTheories('hot', 'week');
                    const topics = await redditService.getTrendingTheoryTopics();
                    
                    if (theories.length > 0) {
                        const theoryList = theories.slice(0, 3).map((post, i) => 
                            `${i + 1}. ${redditService.formatPostForChat(post)}`
                        ).join('\n\n');
                        
                        const topicList = topics.slice(0, 5).join(', ');
                        
                        return {
                            role: 'assistant',
                            content: `**Trending One Piece theories:**\n\n${theoryList}\n\n**Hot topics:** ${topicList}`,
                            metadata: { type: 'reddit', data: { theories, topics } }
                        };
                    }
                    break;
                }
                
                case 'search': {
                    if (query) {
                        const theories = await redditService.searchOnePieceTheories(query);
                        if (theories.length > 0) {
                            const theoryList = theories.slice(0, 3).map((post, i) => {
                                const summary = redditService.extractTheorySummary(post);
                                return `${i + 1}. **${post.title}**\n   ${summary}\n   [Read more](${redditService.getPostUrl(post)})`;
                            }).join('\n\n');
                            
                            return {
                                role: 'assistant',
                                content: `Here are One Piece theories about "${query}":\n\n${theoryList}`,
                                metadata: { type: 'reddit', data: theories }
                            };
                        } else {
                            return {
                                role: 'assistant',
                                content: `I couldn't find any recent theories about "${query}". Try searching for popular topics like "Gear 5", "Void Century", or "Joyboy"!`,
                                metadata: { type: 'reddit' }
                            };
                        }
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Reddit command error:', error);
        }

        // Fallback response
        const context = contextLoader.getFullContext();
        if (context.onePieceTheories) {
            return {
                role: 'assistant',
                content: "I can fetch the latest One Piece theories from Reddit! Try asking about specific topics like 'latest theories about Gear 5' or 'trending One Piece theories'.",
                metadata: { type: 'reddit' }
            };
        }

        return {
            role: 'assistant',
            content: "I had trouble fetching Reddit data. Try again in a moment!",
            metadata: { type: 'reddit' }
        };
    };

    const sendMessage = async (): Promise<void> => {
        if (!input.trim()) return;
        
        if (!apiClientRef.current) {
            setMessages([...messages, { 
                role: 'user' as const, 
                content: input 
            }, {
                role: 'assistant' as const,
                content: 'The chat API is not configured. For now, I can only respond to Spotify, anime, and One Piece theory queries. Try asking "What are the latest One Piece theories?" to test the Reddit integration!'
            }]);
            setInput('');
            return;
        }
        
        // Check rate limit
        if (messageCount >= maxMessages) {
            setMessages([...messages, {
                role: 'assistant' as const,
                content: `You've reached the limit of ${maxMessages} messages for this session. Please refresh the page to start a new conversation.`
            }]);
            return;
        }
        
        const userMessage: Message = { role: 'user' as const, content: input };
        const newMessages: Message[] = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        setMessageCount(messageCount + 1);

        try {
            // Check for API-specific commands
            const command = detectCommand(input);
            
            if (command.type) {
                let response: Message;
                
                switch (command.type) {
                    case 'spotify':
                        response = await handleSpotifyCommand(command.action);
                        break;
                    case 'anime':
                        response = await handleAnimeCommand(command.action, command.query);
                        break;
                    case 'reddit':
                        response = await handleRedditCommand(command.action, command.query);
                        break;
                    default:
                        response = { role: 'assistant', content: 'Command not recognized.' };
                }
                
                setMessages([...newMessages, response]);
            } else {
                // Regular chat API call
                const chatMessages: ChatMessage[] = [
                    { role: 'system', content: contextPrompt },
                    ...newMessages.map(msg => ({ role: msg.role, content: msg.content }))
                ];
                
                const response = await apiClientRef.current.chatCompletion({
                    messages: chatMessages,
                    temperature: 0.7,
                    max_tokens: 500
                });
                setMessages([...newMessages, { role: 'assistant' as const, content: response.content }]);
            }
        } catch (err) {
            console.error("Error in chat:", err);
            
            let errorMessage = 'I had trouble processing that. Please try again.';
            
            if (err instanceof RateLimitError) {
                errorMessage = 'I\'m receiving too many requests right now. Please wait a moment and try again.';
            } else if (err instanceof ApiError) {
                errorMessage = err.message;
            }
            
            setMessages([...newMessages, {
                role: 'assistant' as const,
                content: errorMessage
            }]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-scroll to bottom
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className={className}>
            <div className="chat-header">
                <span>Faraz's Assistant</span>
                <span className="message-counter">{maxMessages - messageCount} msgs left</span>
                <button onClick={onClose}>✕</button>
            </div>
            <div className="chat-body">
                {messages.map((m, i) => (
                    <div key={i} className={'message ' + m.role}>
                        {m.content}
                        {m.metadata?.type === 'spotify' && m.metadata.data && (
                            <div className="message-metadata">
                                🎵 Spotify
                            </div>
                        )}
                        {m.metadata?.type === 'anime' && (
                            <div className="message-metadata">
                                📺 MyAnimeList
                            </div>
                        )}
                        {m.metadata?.type === 'reddit' && (
                            <div className="message-metadata">
                                🏴‍☠️ r/OnePiece
                            </div>
                        )}
                    </div>
                ))}
                {loading && <div className="message assistant">...</div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input">
                <input
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask about Faraz, his projects, or try 'What's he listening to?'"
                    disabled={loading}
                />
                <button onClick={sendMessage} disabled={loading}>Send</button>
            </div>
        </div>
    );
}