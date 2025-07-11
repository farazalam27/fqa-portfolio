import React, { useState, useEffect, useRef } from 'react';
import type { JSX } from 'react';
import { contextLoader } from '../utils/contextLoader';
import { createApiClient, ApiClient, ApiError, RateLimitError, ChatMessage } from '../utils/api';
import { spotifyService } from '../services/spotify';
import { malService } from '../services/myanimelist';
import { redditService } from '../services/reddit';
import ChatSettings from './ChatSettings';

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

export default function ChatWindow({ onClose, className }: ChatWindowProps): JSX.Element {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hey! I'm Faraz's assistant. Ask me anything about him - his projects, skills, experience, or even anime recommendations! I can also show you what he's listening to on Spotify, his anime list, or the latest One Piece theories!" }
    ]);
    const [input, setInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [messageCount, setMessageCount] = useState<number>(0);
    const [contextPrompt, setContextPrompt] = useState<string>('');
    const [ollamaOffline, setOllamaOffline] = useState<boolean>(false);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [spotifyConnected, setSpotifyConnected] = useState<boolean>(false);
    const [malConnected, setMalConnected] = useState<boolean>(false);
    
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
            
            // Check if Ollama is available (only in production)
            if (client && import.meta.env.MODE === 'production') {
                try {
                    // Test connection with a simple request
                    await client.chatCompletion({
                        messages: [{ role: 'user', content: 'test' }],
                        max_tokens: 1
                    });
                } catch {
                    console.log('Ollama appears to be offline');
                    setOllamaOffline(true);
                }
            }
            
            // Load context
            await contextLoader.loadContext();
            setContextPrompt(contextLoader.getContextPrompt());
            
            // Check API authentication status
            setSpotifyConnected(spotifyService.isAuthenticated());
            setMalConnected(malService.isAuthenticated());
        };
        initializeChat();
        
        // Cleanup on unmount
        return () => {
            apiClientRef.current?.cancelRequest();
        };
    }, []);
    
    // Update authentication status when settings close
    useEffect(() => {
        if (!showSettings) {
            setSpotifyConnected(spotifyService.isAuthenticated());
            setMalConnected(malService.isAuthenticated());
            // Reload context to get fresh data if newly authenticated
            contextLoader.loadContext(true).then(() => {
                setContextPrompt(contextLoader.getContextPrompt());
            });
        }
    }, [showSettings]);

    const sendMessage = async (): Promise<void> => {
        if (!input.trim()) return;
        
        if (!apiClientRef.current || ollamaOffline) {
            setMessages([...messages, { 
                role: 'user' as const, 
                content: input 
            }, {
                role: 'assistant' as const,
                content: "Sorry I'm unavailable right now because Faraz is too cheap to keep me running 24/7 :P"
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
            // Always go through Ollama for all messages
            // The context already includes live API data if available
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
        } catch (err) {
            console.error("Error in chat:", err);
            
            let errorMessage = 'I had trouble processing that. Please try again.';
            
            if (err instanceof RateLimitError) {
                errorMessage = 'I\'m receiving too many requests right now. Please wait a moment and try again.';
            } else if (err instanceof ApiError) {
                // Check if it's a connection error to Ollama
                if (err.message.includes('Failed to fetch') || err.code === 'NETWORK_ERROR') {
                    setOllamaOffline(true);
                    errorMessage = "Sorry I'm unavailable right now because Faraz is too cheap to keep me running 24/7 :P";
                } else {
                    errorMessage = err.message;
                }
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
                <div className="flex items-center gap-2">
                    <span className="message-counter">{maxMessages - messageCount} msgs left</span>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="text-gray-400 hover:text-white transition"
                        title="API Settings"
                    >
                        ⚙️
                    </button>
                    <button onClick={onClose}>✕</button>
                </div>
            </div>
            <div className="chat-body">
                {/* Connection status indicator */}
                {messages.length === 1 && (
                    <div className="connection-status">
                        <div className="text-xs text-gray-500 mb-2">
                            API Status: 
                            <span className={spotifyConnected ? 'text-green-400 ml-2' : 'text-gray-600 ml-2'}>
                                🎵 Spotify {spotifyConnected ? '✓' : '✗'}
                            </span>
                            <span className={malConnected ? 'text-green-400 ml-2' : 'text-gray-600 ml-2'}>
                                📺 MAL {malConnected ? '✓' : '✗'}
                            </span>
                        </div>
                    </div>
                )}
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
            <ChatSettings 
                isOpen={showSettings} 
                onClose={() => setShowSettings(false)} 
            />
        </div>
    );
}