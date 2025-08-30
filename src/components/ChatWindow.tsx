import React, { useState, useEffect, useRef } from 'react';
import type { JSX } from 'react';
import { contextLoader } from '../utils/contextLoader';
import { createApiClient, ApiClient, ApiError, RateLimitError, ChatMessage } from '../utils/api';
import { spotifyService } from '../services/spotify';
import { malService } from '../services/myanimelist';

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
    const [ollamaOffline, setOllamaOffline] = useState<boolean>(false);
    
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
            
            // Try to authenticate APIs from stored tokens
            await spotifyService.refreshToken().catch(() => {});
            await malService.refreshToken().catch(() => {});
        };
        initializeChat();
        
        // Cleanup on unmount
        return () => {
            apiClientRef.current?.cancelRequest();
        };
    }, []);
    

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
            // Detect if we need to fetch live API data
            console.log('[ChatWindow] User query:', input);
            await contextLoader.fetchLiveDataForQuery(input);
            
            // Get updated context with live data
            const updatedContextPrompt = contextLoader.getContextPrompt(input);
        console.log('[ChatWindow] Context prompt length:', updatedContextPrompt.length);
        console.log('[ChatWindow] First 200 chars of context:', updatedContextPrompt.substring(0, 200));
            
            // Limit conversation history to prevent context overflow
            const maxHistoryMessages = 10; // Keep last 10 messages (5 exchanges)
            const limitedMessages = newMessages.slice(-maxHistoryMessages);
            
            // Always go through Ollama for all messages
            const chatMessages: ChatMessage[] = [
                { role: 'system', content: updatedContextPrompt },
                ...limitedMessages.map(msg => ({ role: msg.role, content: msg.content }))
            ];
            
            console.log('[ChatWindow] Sending', chatMessages.length, 'messages to Ollama (including system)');
            
            const response = await apiClientRef.current.chatCompletion({
                messages: chatMessages,
                temperature: 0.7,
                max_tokens: 500
            });
            console.log('[ChatWindow] Received response from Ollama:', response.content.substring(0, 100) + '...');
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
                    <button onClick={onClose}>✕</button>
                </div>
            </div>
            <div className="chat-body">
                {messages.map((m, i) => (
                    <div key={i} className={'message ' + m.role}>
                        {m.content}
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
                    placeholder="Ask about Faraz"
                    disabled={loading}
                />
                <button onClick={sendMessage} disabled={loading}>Send</button>
            </div>
        </div>
    );
}