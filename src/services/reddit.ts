import { apiUsageTracker } from '../utils/apiUsageTracker';

interface RedditPost {
  id: string;
  title: string;
  author: string;
  selftext: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  link_flair_text?: string;
  url: string;
  is_self: boolean;
  subreddit: string;
  thumbnail?: string;
  preview?: {
    images: Array<{
      source: {
        url: string;
        width: number;
        height: number;
      };
    }>;
  };
}

interface RedditListing {
  kind: string;
  data: {
    after?: string;
    before?: string;
    children: Array<{
      kind: string;
      data: RedditPost;
    }>;
  };
}

type SortType = 'hot' | 'new' | 'top' | 'rising' | 'relevance';
type TimeFilter = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

interface SearchOptions {
  sort?: SortType;
  time?: TimeFilter;
  limit?: number;
  after?: string;
  restrictToSubreddit?: boolean;
}

export class RedditService {
  private baseUrl = 'https://www.reddit.com';
  private cacheKey = 'reddit_cache';
  private cacheExpiry = 15 * 60 * 1000; // 15 minutes
  private rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;

  // Theory-related flairs for One Piece subreddit
  private theoryFlairs = [
    'Theory',
    'Discussion',
    'Analysis',
    'Manga Theory',
    'Powerscaling',
    'Chapter Secrets'
  ];

  // Popular theory keywords
  private theoryKeywords = [
    'theory',
    'prediction',
    'foreshadowing',
    'analysis',
    'what if',
    'connection',
    'parallel',
    'symbolism',
    'hidden meaning',
    'oda',
    'gear 5',
    'one piece',
    'void century',
    'joyboy',
    'imu',
    'ancient weapons',
    'will of d',
    'laugh tale',
    'final war'
  ];

  // Rate limiting
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
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
      
      // Remove expired item
      delete cache[key];
      localStorage.setItem(this.cacheKey, JSON.stringify(cache));
      
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
  private async fetchReddit<T>(endpoint: string): Promise<T | null> {
    await this.waitForRateLimit();
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'User-Agent': 'web:fqa-portfolio:v1.0.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      apiUsageTracker.recordRequest(true, Date.now() - startTime, 1);
      return data;
    } catch (error) {
      apiUsageTracker.recordRequest(false, Date.now() - startTime, 0, (error as Error).message);
      console.error('Reddit API request failed:', error);
      return null;
    }
  }

  async getSubredditPosts(
    subreddit: string,
    sort: SortType = 'hot',
    options: SearchOptions = {}
  ): Promise<RedditPost[]> {
    const { time = 'week', limit = 25, after } = options;
    const cacheKey = `subreddit_${subreddit}_${sort}_${time}_${limit}`;
    
    // Check cache first
    if (!after) {
      const cached = this.getCachedData<RedditPost[]>(cacheKey);
      if (cached) return cached;
    }

    let endpoint = `/r/${subreddit}/${sort}.json?limit=${limit}`;
    if (sort === 'top' && time) {
      endpoint += `&t=${time}`;
    }
    if (after) {
      endpoint += `&after=${after}`;
    }

    const data = await this.fetchReddit<RedditListing>(endpoint);
    if (!data) return [];

    const posts = data.data.children
      .filter(child => child.kind === 't3')
      .map(child => child.data);

    // Cache if it's the first page
    if (!after && posts.length > 0) {
      this.setCachedData(cacheKey, posts);
    }

    return posts;
  }

  async searchSubreddit(
    subreddit: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<RedditPost[]> {
    const { sort = 'relevance', time = 'all', limit = 25, restrictToSubreddit = true } = options;
    const cacheKey = `search_${subreddit}_${query}_${sort}_${time}`;
    
    const cached = this.getCachedData<RedditPost[]>(cacheKey);
    if (cached) return cached;

    const searchQuery = restrictToSubreddit ? `${query} subreddit:${subreddit}` : query;
    let endpoint = `/search.json?q=${encodeURIComponent(searchQuery)}&sort=${sort}&limit=${limit}`;
    
    if (time !== 'all') {
      endpoint += `&t=${time}`;
    }

    const data = await this.fetchReddit<RedditListing>(endpoint);
    if (!data) return [];

    const posts = data.data.children
      .filter(child => child.kind === 't3')
      .map(child => child.data);

    if (posts.length > 0) {
      this.setCachedData(cacheKey, posts);
    }

    return posts;
  }

  // One Piece specific methods
  async getOnePieceTheories(
    sort: SortType = 'hot',
    timeFilter: TimeFilter = 'week'
  ): Promise<RedditPost[]> {
    const cacheKey = `onepiece_theories_${sort}_${timeFilter}`;
    const cached = this.getCachedData<RedditPost[]>(cacheKey);
    if (cached) return cached;

    // Get posts from One Piece subreddit
    const posts = await this.getSubredditPosts('OnePiece', sort, { time: timeFilter, limit: 100 });
    
    // Filter for theory posts
    const theoryPosts = posts.filter(post => this.isTheoryPost(post));
    
    if (theoryPosts.length > 0) {
      this.setCachedData(cacheKey, theoryPosts);
    }

    return theoryPosts;
  }

  async searchOnePieceTheories(searchTerm: string): Promise<RedditPost[]> {
    // Search specifically for theories containing the search term
    const query = `(${searchTerm}) AND (theory OR analysis OR prediction)`;
    const posts = await this.searchSubreddit('OnePiece', query, {
      sort: 'relevance',
      time: 'all',
      limit: 50
    });

    // Additional filtering for theory content
    return posts.filter(post => this.isTheoryPost(post));
  }

  async getTrendingTheoryTopics(): Promise<string[]> {
    const recentTheories = await this.getOnePieceTheories('hot', 'week');
    
    // Extract common topics from titles
    const topics = new Map<string, number>();
    const importantTerms = [
      'Gear 5', 'Luffy', 'Zoro', 'Sanji', 'Nami', 'Robin', 'Chopper', 'Franky', 'Brook', 'Jinbe',
      'Blackbeard', 'Shanks', 'Dragon', 'Garp', 'Akainu', 'Kizaru', 'Fujitora',
      'Yonko', 'Admiral', 'Gorosei', 'Imu', 'Joyboy', 'Nika',
      'Devil Fruit', 'Haki', 'Conqueror', 'Observation', 'Armament',
      'Void Century', 'Poneglyph', 'Ancient Weapon', 'Pluton', 'Poseidon', 'Uranus',
      'Laugh Tale', 'One Piece', 'Will of D', 'Revolutionary Army',
      'Wano', 'Egghead', 'Elbaf', 'Mary Geoise', 'Final War'
    ];

    recentTheories.forEach(post => {
      const titleLower = post.title.toLowerCase();
      importantTerms.forEach(term => {
        if (titleLower.includes(term.toLowerCase())) {
          topics.set(term, (topics.get(term) || 0) + 1);
        }
      });
    });

    // Sort by frequency and return top topics
    return Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);
  }

  // Utility methods
  private isTheoryPost(post: RedditPost): boolean {
    const titleLower = post.title.toLowerCase();
    const textLower = (post.selftext || '').toLowerCase();
    const flair = post.link_flair_text?.toLowerCase() || '';

    // Check if it has a theory-related flair
    if (this.theoryFlairs.some(f => flair.includes(f.toLowerCase()))) {
      return true;
    }

    // Check if title or text contains theory keywords
    const hasTheoryKeyword = this.theoryKeywords.some(keyword => 
      titleLower.includes(keyword) || textLower.includes(keyword)
    );

    // Must be a text post with substantial content
    const hasSubstantialContent = post.is_self && post.selftext.length > 200;

    return hasTheoryKeyword && hasSubstantialContent;
  }

  formatPostForChat(post: RedditPost): string {
    const timeAgo = this.getTimeAgo(post.created_utc);
    const score = post.score > 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score.toString();
    
    return `"${post.title}" by u/${post.author} (${score} upvotes, ${post.num_comments} comments, ${timeAgo})`;
  }

  getPostUrl(post: RedditPost): string {
    return `https://www.reddit.com${post.permalink}`;
  }

  private getTimeAgo(timestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (seconds < 604800) {
      const days = Math.floor(seconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else if (seconds < 2592000) {
      const weeks = Math.floor(seconds / 604800);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(seconds / 2592000);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
  }

  // Get a summary of a theory post
  extractTheorySummary(post: RedditPost): string {
    const text = post.selftext;
    if (!text) return 'No summary available';

    // Try to find TL;DR or summary sections
    const tldrMatch = text.match(/(?:tl;?dr|summary|conclusion):?\s*(.+?)(?:\n\n|\n-|\n\*|$)/i);
    if (tldrMatch) {
      return tldrMatch[1].trim();
    }

    // Otherwise, get first paragraph or first 200 characters
    const firstParagraph = text.split('\n\n')[0];
    if (firstParagraph.length <= 200) {
      return firstParagraph;
    }

    return firstParagraph.substring(0, 197) + '...';
  }
}

// Export singleton instance
export const redditService = new RedditService();