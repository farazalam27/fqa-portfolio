// API Type Definitions
// Centralized type definitions for API integrations

// OpenAI API Types
export interface OpenAIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface OpenAICompletionRequest {
    model: string;
    messages: OpenAIMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stream?: boolean;
}

export interface OpenAICompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: OpenAIMessage;
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// Anthropic API Types
export interface AnthropicMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface AnthropicCompletionRequest {
    model: string;
    messages: AnthropicMessage[];
    system?: string;
    max_tokens: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    stream?: boolean;
}

export interface AnthropicCompletionResponse {
    id: string;
    type: string;
    role: string;
    content: Array<{
        type: string;
        text: string;
    }>;
    model: string;
    stop_reason: string;
    stop_sequence: string | null;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}

// Ollama API Types
export interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    system?: string;
    template?: string;
    context?: number[];
    stream?: boolean;
    raw?: boolean;
    format?: 'json';
    options?: {
        num_keep?: number;
        seed?: number;
        num_predict?: number;
        top_k?: number;
        top_p?: number;
        tfs_z?: number;
        typical_p?: number;
        repeat_last_n?: number;
        temperature?: number;
        repeat_penalty?: number;
        presence_penalty?: number;
        frequency_penalty?: number;
        mirostat?: number;
        mirostat_tau?: number;
        mirostat_eta?: number;
        penalize_newline?: boolean;
        stop?: string[];
    };
}

export interface OllamaGenerateResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

// Generic API Error Response
export interface ApiErrorResponse {
    error: {
        message: string;
        type?: string;
        code?: string;
        param?: string;
    };
}