import { projectId, publicAnonKey } from '../utils/supabase/info';
import * as sqlite from './sqlite-adapter';

const LOCAL_BASE_URL = `/api`;
const REMOTE_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-52ad7d0c`;

type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
type CardType = 'creature' | 'spell' | 'artifact' | 'enchantment';
type Variant = 'normal' | 'shiny' | 'holographic' | 'first-edition';

interface CardData {
  id: string;
  title: string;
  description: string;
  rarity: Rarity;
  type: CardType;
  collection: string;
  imageUrl: string;
  imagePrompt: string;
  variant: Variant;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class CardForgeAPI {
  private useSQLite = true;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    if (this.useSQLite) {
      return { success: false, error: 'SQLite mode active - direct HTTP disabled' } as any;
    }
    // Build headers without overriding for FormData
    const isForm = typeof (options as any).body !== 'undefined' && (options as any).body instanceof FormData;
    const baseHeaders: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    if (!isForm) baseHeaders['Content-Type'] = baseHeaders['Content-Type'] || 'application/json';

    // Try local dev server first, then remote, then SQLite
    // Try local
    try {
      let localResponse: Response | null = null;
      try {
        localResponse = await fetch(`${LOCAL_BASE_URL}${endpoint}`, {
          ...options,
          headers: baseHeaders,
        } as any);
      } catch (e) {
        localResponse = null;
      }

      if (localResponse && localResponse.ok) {
        const data = await localResponse.json();
        return data;
      }

      // Try remote
      try {
        const remoteHeaders = {
          ...baseHeaders,
          Authorization: `Bearer ${publicAnonKey}`,
        };
        const remoteResponse = await fetch(`${REMOTE_BASE_URL}${endpoint}`, {
          ...options,
          headers: remoteHeaders,
        } as any);
        const data = await remoteResponse.json();
        if (!remoteResponse.ok) {
          return { success: false, error: data.error || `HTTP ${remoteResponse.status}: ${remoteResponse.statusText}` } as any;
        }
        return data;
      } catch (e) {
        // Both local and remote failed
        await sqlite.init();
        this.useSQLite = true;
        return { success: false, error: 'Switched to SQLite mode' } as any;
      }
    } catch (error) {
      await sqlite.init();
      this.useSQLite = true;
      return { success: false, error: 'Switched to SQLite mode' } as any;
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    if (this.useSQLite) return sqlite.healthCheck();
    const res = await this.request<{ status: string }>(`/health`);
    if (!res.success) {
      // now in sqlite mode
      return sqlite.healthCheck();
    }
    return res;
  }

  // Cards CRUD operations
  async getCards(): Promise<ApiResponse<CardData[]>> {
    if (this.useSQLite) {
      const r = await sqlite.getCards();
      if (r.success && r.data) r.data = r.data.map(c => ({ ...c, createdAt: new Date(c.createdAt) } as any));
      return r as any;
    }
    const response = await this.request<CardData[]>(`/cards`);
    if (response.success && response.data) {
      response.data = response.data.map(card => ({
        ...card,
        createdAt: new Date(card.createdAt),
        updatedAt: card.updatedAt ? new Date(card.updatedAt) : undefined,
      }));
    }
    return response;
  }

  async getCard(id: string): Promise<ApiResponse<CardData>> {
    if (this.useSQLite) {
      const r = await sqlite.getCard(id);
      if (r.success && r.data) r.data = { ...r.data, createdAt: new Date(r.data.createdAt) } as any;
      return r as any;
    }
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
    if (this.useSQLite) {
      const r = await sqlite.createCard(cardData as any);
      if (r.success && r.data) r.data = { ...r.data, createdAt: new Date(r.data.createdAt) } as any;
      return r as any;
    }
    const response = await this.request<CardData>(`/cards`, { method: 'POST', body: JSON.stringify(cardData) });
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
    if (this.useSQLite) {
      const r = await sqlite.updateCard(id, cardData as any);
      if (r.success && r.data) r.data = { ...r.data, createdAt: new Date(r.data.createdAt) } as any;
      return r as any;
    }
    const response = await this.request<CardData>(`/cards/${id}`, { method: 'PUT', body: JSON.stringify(cardData) });
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
    if (this.useSQLite) return sqlite.deleteCard(id) as any;
    return this.request(`/cards/${id}`, { method: 'DELETE' });
  }

  async generateImage(prompt: string, cardType: string): Promise<ApiResponse<{ imageUrl: string; prompt: string; generatedAt: string }>> {
    if (this.useSQLite) return sqlite.generateImage(prompt, cardType) as any;
    return this.request(`/generate-image`, { method: 'POST', body: JSON.stringify({ prompt, cardType }) });
  }

  async uploadImage(file: File): Promise<ApiResponse<{ imageUrl: string; fileName: string; uploadedAt: string }>> {
    if (this.useSQLite) return sqlite.uploadImage(file) as any;
    const formData = new FormData();
    formData.append('image', file);
    return this.request(`/upload-image`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      body: formData,
    });
  }

  async exportCard(id: string, format: 'json' | 'png' | 'pdf' = 'json'): Promise<ApiResponse<CardData>> {
    if (this.useSQLite) {
      const card = await this.getCard(id);
      return card as any;
    }
    return this.request(`/cards/${id}/export?format=${format}`);
  }

  async getStats(): Promise<ApiResponse<{ totalCards: number; rarityBreakdown: Record<string, number>; typeBreakdown: Record<string, number>; collectionBreakdown: Record<string, number>; recentActivity: CardData[]; }>> {
    if (this.useSQLite) return sqlite.getStats() as any;
    const response = await this.request(`/stats`);
    if ((response as any).success && (response as any).data) {
      (response as any).data.recentActivity = (response as any).data.recentActivity.map((card: any) => ({
        ...card,
        createdAt: new Date(card.createdAt),
        updatedAt: card.updatedAt ? new Date(card.updatedAt) : undefined,
      }));
    }
    return response as any;
  }
}

export const cardForgeAPI = new CardForgeAPI();
export type { CardData, ApiResponse };
