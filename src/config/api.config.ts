// API Configuration
// Environment-specific API configurations

export interface ApiEnvironmentConfig {
    provider: 'openai' | 'anthropic' | 'ollama' | 'custom';
    baseUrl: string;
    apiKey?: string;
    model?: string;
    maxRetries?: number;
    timeout?: number;
    rateLimit?: {
        maxRequests: number;
        windowMs: number;
    };
}

// Get environment type
const getEnvironment = (): 'development' | 'staging' | 'production' => {
    if (import.meta.env.MODE === 'production') return 'production';
    if (import.meta.env.MODE === 'staging') return 'staging';
    return 'development';
};

// Environment-specific configurations
const configs: Record<string, ApiEnvironmentConfig> = {
    development: {
        provider: 'ollama',
        baseUrl: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434',
        model: 'llama3.2',
        maxRetries: 3,
        timeout: 30000,
        rateLimit: {
            maxRequests: 30,
            windowMs: 60000
        }
    },
    staging: {
        provider: import.meta.env.VITE_USE_OPENAI === 'true' ? 'openai' : 'custom',
        baseUrl: import.meta.env.VITE_CHAT_API_URL || 'https://api.openai.com/v1',
        apiKey: import.meta.env.VITE_CHAT_API_KEY,
        model: 'gpt-3.5-turbo',
        maxRetries: 3,
        timeout: 45000,
        rateLimit: {
            maxRequests: 20,
            windowMs: 60000
        }
    },
    production: {
        provider: import.meta.env.VITE_USE_OPENAI === 'true' ? 'openai' : 'custom',
        baseUrl: import.meta.env.VITE_CHAT_API_URL || 'https://api.openai.com/v1',
        apiKey: import.meta.env.VITE_CHAT_API_KEY,
        model: import.meta.env.VITE_MODEL || 'gpt-3.5-turbo',
        maxRetries: 3,
        timeout: 60000,
        rateLimit: {
            maxRequests: 20,
            windowMs: 60000
        }
    }
};

// Export the current environment configuration
export const apiConfig: ApiEnvironmentConfig = configs[getEnvironment()];

// Helper to check if API is configured
export const isApiConfigured = (): boolean => {
    const env = getEnvironment();
    const config = configs[env];
    
    // Ollama doesn't need API key
    if (config.provider === 'ollama') {
        return true;
    }
    
    // Other providers need API key
    return Boolean(config.apiKey);
};

// Helper to get a user-friendly message about API configuration
export const getApiConfigMessage = (): string => {
    const env = getEnvironment();
    const config = configs[env];
    
    if (isApiConfigured()) {
        return `Connected to ${config.provider} API`;
    }
    
    if (env === 'development') {
        return 'Make sure Ollama is running locally on port 11434';
    }
    
    return 'Please configure your API key in the environment variables';
};