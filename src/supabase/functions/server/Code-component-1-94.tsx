// AI Service for image generation with OpenAI DALL-E integration
// This shows how real AI integration would be implemented

export interface AIImageRequest {
  prompt: string;
  cardType: string;
  style?: 'fantasy' | 'realistic' | 'anime' | 'digital-art';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
}

export interface AIImageResponse {
  imageUrl: string;
  revisedPrompt?: string;
  generatedAt: string;
}

export class AIImageService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/images/generations';

  constructor() {
    this.apiKey = Deno.env.get('OPENAI_API_KEY') || '';
  }

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    if (!this.apiKey) {
      console.log('OpenAI API key not found, using fallback image generation');
      return this.generateFallbackImage(request);
    }

    try {
      // Enhance prompt for better card artwork results
      const enhancedPrompt = this.enhancePromptForCardArt(request.prompt, request.cardType);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          n: 1,
          size: request.size || '1024x1024',
          quality: 'standard',
          style: 'vivid'
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.status, response.statusText);
        return this.generateFallbackImage(request);
      }

      const data = await response.json();
      
      if (data.data && data.data[0]) {
        return {
          imageUrl: data.data[0].url,
          revisedPrompt: data.data[0].revised_prompt,
          generatedAt: new Date().toISOString()
        };
      } else {
        console.error('Unexpected OpenAI response format:', data);
        return this.generateFallbackImage(request);
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return this.generateFallbackImage(request);
    }
  }

  private enhancePromptForCardArt(prompt: string, cardType: string): string {
    const basePrompt = prompt.trim();
    
    // Add card-specific styling based on type
    const typeEnhancements = {
      creature: 'fantasy creature portrait, detailed character art',
      spell: 'magical energy effects, mystical spell casting',
      artifact: 'ancient magical item, ornate design',
      enchantment: 'magical aura, enchanted atmosphere'
    };

    const enhancement = typeEnhancements[cardType as keyof typeof typeEnhancements] || 'fantasy game art';
    
    return `${basePrompt}, ${enhancement}, high quality digital art, professional game card artwork, detailed illustration, fantasy style, centered composition, dramatic lighting`;
  }

  private async generateFallbackImage(request: AIImageRequest): Promise<AIImageResponse> {
    // Fallback to Unsplash with better search terms
    const keywords = this.extractKeywords(request.prompt, request.cardType);
    const searchTerm = keywords.join(',');
    
    // Use a more reliable image service or local placeholder
    const fallbackUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(searchTerm)}`;
    
    return {
      imageUrl: fallbackUrl,
      revisedPrompt: `Fallback image for: ${request.prompt}`,
      generatedAt: new Date().toISOString()
    };
  }

  private extractKeywords(prompt: string, cardType: string): string[] {
    // Extract meaningful keywords for image search
    const words = prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'with', 'for', 'are', 'but', 'not', 'you', 'all', 'can'].includes(word));
    
    // Combine with card type and fantasy theme
    const keywords = [cardType, 'fantasy', 'game', 'art', ...words.slice(0, 3)];
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  // Alternative AI services integration examples
  async generateWithStabilityAI(request: AIImageRequest): Promise<AIImageResponse> {
    const stabilityApiKey = Deno.env.get('STABILITY_API_KEY');
    
    if (!stabilityApiKey) {
      return this.generateFallbackImage(request);
    }

    // Stability AI implementation would go here
    // This is a placeholder showing how to integrate other AI services
    console.log('Stability AI integration not implemented in this demo');
    return this.generateFallbackImage(request);
  }

  async generateWithMidjourney(request: AIImageRequest): Promise<AIImageResponse> {
    // Midjourney API integration would go here
    // This would require their API when available
    console.log('Midjourney integration not implemented in this demo');
    return this.generateFallbackImage(request);
  }
}

// Export singleton instance
export const aiImageService = new AIImageService();
