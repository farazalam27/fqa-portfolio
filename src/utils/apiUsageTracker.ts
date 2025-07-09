// API Usage Tracker
// Tracks API usage statistics for monitoring and debugging

export interface UsageStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalTokensUsed: number;
    averageResponseTime: number;
    lastRequestTime: Date | null;
    errors: Array<{
        timestamp: Date;
        error: string;
        code?: string;
    }>;
}

export interface SessionStats {
    sessionId: string;
    startTime: Date;
    endTime?: Date;
    stats: UsageStats;
}

export class ApiUsageTracker {
    private static instance: ApiUsageTracker;
    private currentSession: SessionStats;
    private sessions: SessionStats[] = [];
    private responseTimes: number[] = [];
    private readonly maxErrorsStored = 10;
    private readonly maxResponseTimesStored = 100;

    private constructor() {
        this.currentSession = this.createNewSession();
        this.loadFromLocalStorage();
    }

    static getInstance(): ApiUsageTracker {
        if (!ApiUsageTracker.instance) {
            ApiUsageTracker.instance = new ApiUsageTracker();
        }
        return ApiUsageTracker.instance;
    }

    private createNewSession(): SessionStats {
        return {
            sessionId: this.generateSessionId(),
            startTime: new Date(),
            stats: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                totalTokensUsed: 0,
                averageResponseTime: 0,
                lastRequestTime: null,
                errors: []
            }
        };
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    recordRequest(success: boolean, responseTime: number, tokensUsed?: number, error?: string, errorCode?: string): void {
        const stats = this.currentSession.stats;
        
        stats.totalRequests++;
        stats.lastRequestTime = new Date();
        
        if (success) {
            stats.successfulRequests++;
        } else {
            stats.failedRequests++;
            if (error) {
                stats.errors.push({
                    timestamp: new Date(),
                    error: error,
                    code: errorCode
                });
                // Keep only the last N errors
                if (stats.errors.length > this.maxErrorsStored) {
                    stats.errors = stats.errors.slice(-this.maxErrorsStored);
                }
            }
        }

        if (tokensUsed) {
            stats.totalTokensUsed += tokensUsed;
        }

        // Update average response time
        this.responseTimes.push(responseTime);
        if (this.responseTimes.length > this.maxResponseTimesStored) {
            this.responseTimes.shift();
        }
        stats.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

        this.saveToLocalStorage();
    }

    getCurrentSessionStats(): SessionStats {
        return { ...this.currentSession };
    }

    getAllSessions(): SessionStats[] {
        return [...this.sessions, this.currentSession];
    }

    getAggregatedStats(): UsageStats {
        const allSessions = this.getAllSessions();
        
        return allSessions.reduce((acc, session) => {
            const stats = session.stats;
            return {
                totalRequests: acc.totalRequests + stats.totalRequests,
                successfulRequests: acc.successfulRequests + stats.successfulRequests,
                failedRequests: acc.failedRequests + stats.failedRequests,
                totalTokensUsed: acc.totalTokensUsed + stats.totalTokensUsed,
                averageResponseTime: stats.averageResponseTime, // Use current session's average
                lastRequestTime: stats.lastRequestTime || acc.lastRequestTime,
                errors: [...acc.errors, ...stats.errors].slice(-this.maxErrorsStored)
            };
        }, {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokensUsed: 0,
            averageResponseTime: 0,
            lastRequestTime: null,
            errors: []
        } as UsageStats);
    }

    startNewSession(): void {
        this.currentSession.endTime = new Date();
        this.sessions.push(this.currentSession);
        
        // Keep only last 10 sessions
        if (this.sessions.length > 10) {
            this.sessions = this.sessions.slice(-10);
        }
        
        this.currentSession = this.createNewSession();
        this.responseTimes = [];
        this.saveToLocalStorage();
    }

    clearAllData(): void {
        this.sessions = [];
        this.currentSession = this.createNewSession();
        this.responseTimes = [];
        localStorage.removeItem('api_usage_stats');
    }

    private saveToLocalStorage(): void {
        try {
            const data = {
                sessions: this.sessions,
                currentSession: this.currentSession,
                responseTimes: this.responseTimes
            };
            localStorage.setItem('api_usage_stats', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save usage stats to localStorage:', error);
        }
    }

    private loadFromLocalStorage(): void {
        try {
            const stored = localStorage.getItem('api_usage_stats');
            if (stored) {
                const data = JSON.parse(stored);
                this.sessions = data.sessions || [];
                this.responseTimes = data.responseTimes || [];
                
                // Convert date strings back to Date objects
                this.sessions.forEach(session => {
                    session.startTime = new Date(session.startTime);
                    if (session.endTime) {
                        session.endTime = new Date(session.endTime);
                    }
                    if (session.stats.lastRequestTime) {
                        session.stats.lastRequestTime = new Date(session.stats.lastRequestTime);
                    }
                    session.stats.errors.forEach(error => {
                        error.timestamp = new Date(error.timestamp);
                    });
                });
            }
        } catch (error) {
            console.error('Failed to load usage stats from localStorage:', error);
        }
    }

    // Helper method to get a summary string
    getSummary(): string {
        const stats = this.getAggregatedStats();
        const successRate = stats.totalRequests > 0 
            ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)
            : 0;
        
        return `Total Requests: ${stats.totalRequests} | Success Rate: ${successRate}% | Avg Response: ${stats.averageResponseTime.toFixed(0)}ms | Tokens Used: ${stats.totalTokensUsed}`;
    }
}

// Export singleton instance
export const apiUsageTracker = ApiUsageTracker.getInstance();