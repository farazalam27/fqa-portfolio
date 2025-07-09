// API Utility Module for centralized API management
// Supports multiple LLM providers and proper error handling

import { apiUsageTracker } from './apiUsageTracker';
import { apiConfig } from '../config/api.config';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatCompletionRequest {
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}

export interface ChatCompletionResponse {
    content: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    error?: string;
}

export interface ApiConfig {
    provider: 'openai' | 'anthropic' | 'ollama' | 'custom';
    apiKey?: string;
    baseUrl: string;
    model?: string;
    maxRetries?: number;
    timeout?: number;
}

// API Error types
export class ApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export class RateLimitError extends ApiError {
    constructor(message: string, public resetTime?: Date) {
        super(message, 429, 'RATE_LIMIT');
        this.name = 'RateLimitError';
    }
}

// Rate limiting tracker
class RateLimiter {
    private requests: number[] = [];
    private readonly windowMs = 60000; // 1 minute window
    private readonly maxRequests = 20;

    canMakeRequest(): boolean {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        return this.requests.length < this.maxRequests;
    }

    recordRequest(): void {
        this.requests.push(Date.now());
    }

    getResetTime(): Date {
        if (this.requests.length === 0) return new Date();
        const oldestRequest = Math.min(...this.requests);
        return new Date(oldestRequest + this.windowMs);
    }
}

// Main API Client class
export class ApiClient {
    private config: ApiConfig;
    private rateLimiter: RateLimiter;
    private abortController?: AbortController;

    constructor(config: ApiConfig) {
        this.config = {
            maxRetries: 3,
            timeout: 30000, // 30 seconds
            ...config
        };
        this.rateLimiter = new RateLimiter();
    }

    async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        const startTime = Date.now();
        
        // Check rate limit
        if (!this.rateLimiter.canMakeRequest()) {
            const error = new RateLimitError(
                'Rate limit exceeded. Please wait before making another request.',
                this.rateLimiter.getResetTime()
            );
            apiUsageTracker.recordRequest(false, 0, undefined, error.message, error.code);
            throw error;
        }

        // Record the request
        this.rateLimiter.recordRequest();

        // Perform the request with retries
        let lastError: Error | null = null;
        let response: ChatCompletionResponse | null = null;
        
        for (let attempt = 0; attempt < (this.config.maxRetries || 3); attempt++) {
            try {
                response = await this.performRequest(request);
                
                // Record successful request
                const responseTime = Date.now() - startTime;
                apiUsageTracker.recordRequest(true, responseTime, response.usage?.total_tokens);
                
                return response;
            } catch (error) {
                lastError = error as Error;
                
                // Don't retry on rate limit or client errors
                if (error instanceof RateLimitError || 
                    (error instanceof ApiError && error.status && error.status < 500)) {
                    const responseTime = Date.now() - startTime;
                    apiUsageTracker.recordRequest(
                        false, 
                        responseTime, 
                        undefined, 
                        error.message, 
                        error instanceof ApiError ? error.code : undefined
                    );
                    throw error;
                }

                // Wait before retrying (exponential backoff)
                if (attempt < (this.config.maxRetries || 3) - 1) {
                    await this.delay(Math.pow(2, attempt) * 1000);
                }
            }
        }

        // Record final failure
        const responseTime = Date.now() - startTime;
        const finalError = lastError || new ApiError('Failed to complete request after retries');
        apiUsageTracker.recordRequest(
            false, 
            responseTime, 
            undefined, 
            finalError.message,
            finalError instanceof ApiError ? finalError.code : undefined
        );
        
        throw finalError;
    }

    private async performRequest(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        this.abortController = new AbortController();
        const timeoutId = setTimeout(() => this.abortController?.abort(), this.config.timeout);

        try {
            switch (this.config.provider) {
                case 'openai':
                    return await this.openAIRequest(request);
                case 'anthropic':
                    return await this.anthropicRequest(request);
                case 'ollama':
                    return await this.ollamaRequest(request);
                case 'custom':
                    return await this.customRequest(request);
                default:
                    throw new ApiError(`Unsupported provider: ${this.config.provider}`);
            }
        } finally {
            clearTimeout(timeoutId);
            this.abortController = undefined;
        }
    }

    private async openAIRequest(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model || 'gpt-3.5-turbo',
                messages: request.messages,
                temperature: request.temperature ?? 0.7,
                max_tokens: request.max_tokens ?? 500,
                stream: false
            }),
            signal: this.abortController?.signal
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(
                errorData.error?.message || `OpenAI API error: ${response.statusText}`,
                response.status,
                errorData.error?.code,
                errorData
            );
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || '',
            usage: data.usage
        };
    }

    private async anthropicRequest(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        // Convert messages to Anthropic format
        const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
        const messages = request.messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
            }));

        const response = await fetch(`${this.config.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.apiKey || '',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.config.model || 'claude-3-sonnet-20240229',
                system: systemMessage,
                messages: messages,
                max_tokens: request.max_tokens ?? 500,
                temperature: request.temperature ?? 0.7
            }),
            signal: this.abortController?.signal
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(
                errorData.error?.message || `Anthropic API error: ${response.statusText}`,
                response.status,
                errorData.error?.type,
                errorData
            );
        }

        const data = await response.json();
        return {
            content: data.content[0]?.text || '',
            usage: data.usage
        };
    }

    private async ollamaRequest(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        // For Ollama, we'll use the generate endpoint with a formatted prompt
        const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
        const lastUserMessage = request.messages.filter(m => m.role === 'user').pop()?.content || '';
        const prompt = systemMessage ? `${systemMessage}\n\nUser: ${lastUserMessage}` : lastUserMessage;

        const response = await fetch(`${this.config.baseUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.config.model || 'llama3.2',
                prompt: prompt,
                stream: false,
                options: {
                    temperature: request.temperature ?? 0.7,
                    num_predict: request.max_tokens ?? 500
                }
            }),
            signal: this.abortController?.signal
        });

        if (!response.ok) {
            throw new ApiError(
                `Ollama API error: ${response.statusText}`,
                response.status
            );
        }

        const data = await response.json();
        return {
            content: data.response || ''
        };
    }

    private async customRequest(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        // Generic request format for custom endpoints
        const response = await fetch(this.config.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {})
            },
            body: JSON.stringify({
                messages: request.messages,
                temperature: request.temperature,
                max_tokens: request.max_tokens
            }),
            signal: this.abortController?.signal
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => response.statusText);
            throw new ApiError(
                `Custom API error: ${errorText}`,
                response.status
            );
        }

        const data = await response.json();
        // Assume response has a 'content' field
        return {
            content: data.content || data.response || data.message || ''
        };
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    cancelRequest(): void {
        this.abortController?.abort();
    }
}

// Factory function to create API client from environment variables
export function createApiClient(): ApiClient | null {
    // Use configuration from api.config.ts
    const config = apiConfig;
    
    // Check if we have a valid configuration
    if (!config.baseUrl) {
        return null;
    }
    
    // For Ollama, we don't need an API key
    if (config.provider === 'ollama') {
        return new ApiClient({
            provider: config.provider,
            baseUrl: config.baseUrl,
            model: config.model,
            maxRetries: config.maxRetries,
            timeout: config.timeout
        });
    }
    
    // For other providers, check if API key is configured
    if (config.apiKey) {
        return new ApiClient({
            provider: config.provider,
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            model: config.model,
            maxRetries: config.maxRetries,
            timeout: config.timeout
        });
    }
    
    // No valid configuration
    return null;
}