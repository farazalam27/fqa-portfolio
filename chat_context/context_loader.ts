// Context Loader for Chat Assistant
// This module loads context files to provide personalized responses

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
    personal: {
        name: string;
        title: string;
        email: string;
        location: string;
    };
    education: any;
    experience: any[];
    certifications: any[];
    projects: any[];
    skills_summary: any;
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
    resume?: ResumeData;
    technicalSkills?: TechnicalSkills;
}

export class ContextLoader {
    private context: ChatContext = {};
    private contextLoaded: boolean = false;
    
    // Import context files statically for Vite bundling
    private async loadStaticContext(): Promise<void> {
        try {
            // Import JSON files
            const [animeData, resumeData, skillsData] = await Promise.all([
                import('./personal/anime_recommendations.json'),
                import('./resume/resume_text.json'),
                import('./skills/technical_skills.json')
            ]);
            
            this.context.animeRecommendations = animeData.default;
            this.context.resume = resumeData.default;
            this.context.technicalSkills = skillsData.default;
            
            // Load One Piece theories (markdown as text)
            const theoriesResponse = await fetch('/chat_context/personal/one_piece_theories.md');
            if (theoriesResponse.ok) {
                this.context.onePieceTheories = await theoriesResponse.text();
            }
            
            // Try to load Spotify recommendations if it exists
            try {
                const spotifyData = await import('./personal/spotify_recommendations.json');
                this.context.spotifyRecommendations = spotifyData.default;
            } catch {
                // File doesn't exist yet, that's okay
            }
            
            this.contextLoaded = true;
        } catch (error) {
            console.error('Error loading context:', error);
        }
    }
    
    async loadContext(): Promise<ChatContext> {
        if (!this.contextLoaded) {
            await this.loadStaticContext();
        }
        return this.context;
    }
    
    getContextPrompt(): string {
        let prompt = `You are Faraz's AI assistant. You have detailed knowledge about Faraz including:\n\n`;
        
        if (this.context.resume) {
            const resume = this.context.resume;
            prompt += `Professional Background:\n`;
            prompt += `- ${resume.personal.title} with experience at ${resume.experience[0].company}\n`;
            prompt += `- Education: ${resume.education.degree} from ${resume.education.university}\n`;
            prompt += `- Certifications: ${resume.certifications.map(c => c.name).join(', ')}\n\n`;
        }
        
        if (this.context.technicalSkills) {
            const skills = this.context.technicalSkills;
            prompt += `Technical Skills:\n`;
            prompt += `- Languages: ${skills.languages.join(', ')}\n`;
            prompt += `- Frontend: ${skills.frameworks.frontend.join(', ')}\n`;
            prompt += `- Backend: ${skills.frameworks.backend.join(', ')}\n`;
            prompt += `- Cloud/AWS: ${skills.cloud_services.aws.join(', ')}\n\n`;
        }
        
        if (this.context.animeRecommendations) {
            prompt += `Personal Interests:\n`;
            prompt += `- Anime enthusiast with favorites including ${this.context.animeRecommendations.favorites.join(', ')}\n`;
        }
        
        if (this.context.onePieceTheories) {
            prompt += `- One Piece fan with theories about the series\n`;
        }
        
        if (this.context.spotifyRecommendations) {
            prompt += `- Music lover with diverse taste in genres\n`;
        }
        
        prompt += `\nBe helpful, friendly, and knowledgeable when answering questions about Faraz.`;
        
        return prompt;
    }
    
    // Get formatted context for display
    getFormattedContext(): string {
        let formatted = '';
        
        if (this.context.resume) {
            const resume = this.context.resume;
            formatted += `**${resume.personal.name}**\n${resume.personal.title}\n\n`;
            
            formatted += `**Recent Projects:**\n`;
            resume.projects.slice(0, 3).forEach(project => {
                formatted += `- ${project.name}: ${project.description}\n`;
            });
        }
        
        return formatted;
    }
}

// Export singleton instance
export const contextLoader = new ContextLoader();