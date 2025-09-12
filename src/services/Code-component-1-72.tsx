import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-52ad7d0c`;

interface CardData {
  id: string;
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  type: 'creature' | 'spell' | 'artifact' | 'enchantment';
  collection: string;
  imageUrl: string;
  imagePrompt: string;
  variant: 'normal' | 'shiny' | 'holographic' | 'first-edition';
  createdAt: Date | string;
  updatedAt?: Date | string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class CardForgeAPI {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error(`API Error (${response.status}):`, data);
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      console.error('Network error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request('/health');
  }

  // Cards CRUD operations
  async getCards(): Promise<ApiResponse<CardData[]>> {
    const response = await this.request<CardData[]>('/cards');
    
    if (response.success && response.data) {
      // Convert date strings back to Date objects
      response.data = response.data.map(card => ({
        ...card,
        createdAt: new Date(card.createdAt),
        updatedAt: card.updatedAt ? new Date(card.updatedAt) : undefined,
      }));
    }
    
    return response;
  }

  async getCard(id: string): Promise<ApiResponse<CardData>> {
    const response = await this.request<CardData>(`/cards/${id}`);
    
    if (response.success && response.data) {
      response.data = {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
        updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined,
      };
    }
    
    return response;
  }

  async createCard(cardData: Partial<CardData>): Promise<ApiResponse<CardData>> {
    const response = await this.request<CardData>('/cards', {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
    
    if (response.success && response.data) {
      response.data = {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
        updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined,
      };
    }
    
    return response;
  }

  async updateCard(id: string, cardData: Partial<CardData>): Promise<ApiResponse<CardData>> {
    const response = await this.request<CardData>(`/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cardData),
    });
    
    if (response.success && response.data) {
      response.data = {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
        updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined,
      };
    }
    
    return response;
  }

  async deleteCard(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/cards/${id}`, {
      method: 'DELETE',
    });
  }

  // AI Image Generation
  async generateImage(prompt: string, cardType: string): Promise<ApiResponse<{
    imageUrl: string;
    prompt: string;
    generatedAt: string;
  }>> {
    return this.request('/generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt, cardType }),
    });
  }

  // Image Upload
  async uploadImage(file: File): Promise<ApiResponse<{
    imageUrl: string;
    fileName: string;
    uploadedAt: string;
  }>> {
    const formData = new FormData();
    formData.append('image', file);

    return this.request('/upload-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        // Don't set Content-Type for FormData, let browser set it
      },
      body: formData,
    });
  }

  // Export
  async exportCard(id: string, format: 'json' | 'png' | 'pdf' = 'json'): Promise<ApiResponse<CardData>> {
    return this.request(`/cards/${id}/export?format=${format}`);
  }

  // Stats
  async getStats(): Promise<ApiResponse<{
    totalCards: number;
    rarityBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
    collectionBreakdown: Record<string, number>;
    recentActivity: CardData[];
  }>> {
    const response = await this.request<{
      totalCards: number;
      rarityBreakdown: Record<string, number>;
      typeBreakdown: Record<string, number>;
      collectionBreakdown: Record<string, number>;
      recentActivity: CardData[];
    }>('/stats');
    
    if (response.success && response.data) {
      response.data.recentActivity = response.data.recentActivity.map(card => ({
        ...card,
        createdAt: new Date(card.createdAt),
        updatedAt: card.updatedAt ? new Date(card.updatedAt) : undefined,
      }));
    }
    
    return response;
  }
}

// Export singleton instance
export const cardForgeAPI = new CardForgeAPI();

// Export types
export type { CardData, ApiResponse };
