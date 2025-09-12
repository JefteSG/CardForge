import { initDB, all, run } from './sqlite-db';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type CardType = 'creature' | 'spell' | 'artifact' | 'enchantment';
export type Variant = 'normal' | 'shiny' | 'holographic' | 'first-edition';

export interface CardData {
  id: string;
  title: string;
  description: string;
  rarity: Rarity;
  type: CardType;
  collection: string;
  imageUrl: string;
  imagePrompt: string;
  variant: Variant;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse<T> { success: boolean; data?: T; error?: string; }

export async function init() { await initDB(); }

export async function healthCheck(): Promise<ApiResponse<{ status: string }>> {
  await init();
  return { success: true, data: { status: 'ok-local' } };
}

export async function getCards(): Promise<ApiResponse<CardData[]>> {
  const rows = all<CardData>(`SELECT * FROM cards ORDER BY datetime(createdAt) DESC`);
  return { success: true, data: rows };
}

export async function getCard(id: string): Promise<ApiResponse<CardData>> {
  const rows = all<CardData>(`SELECT * FROM cards WHERE id = ? LIMIT 1`, [id]);
  if (!rows[0]) return { success: false, error: 'Card not found' };
  return { success: true, data: rows[0] };
}

export async function createCard(input: Partial<CardData>): Promise<ApiResponse<CardData>> {
  const id = input.id || crypto.randomUUID();
  const now = new Date().toISOString();
  // Normalize createdAt to ISO string
  const normalizedCreatedAt = input.createdAt
    ? (typeof input.createdAt === 'string'
        ? // try to parse string; if already ISO-like keep, else convert
          (() => { const d = new Date(input.createdAt as string); return isNaN(d.getTime()) ? String(input.createdAt) : d.toISOString(); })()
        : new Date(input.createdAt as any).toISOString())
    : now;

  const card: CardData = {
    id,
    title: input.title || 'Untitled',
    description: input.description || '',
    rarity: (input.rarity as any) || 'common',
    type: (input.type as any) || 'creature',
    collection: input.collection || 'Default',
    imageUrl: input.imageUrl || '',
    imagePrompt: input.imagePrompt || '',
    variant: (input.variant as any) || 'normal',
    createdAt: normalizedCreatedAt,
    updatedAt: now,
  };

  run(
    `INSERT INTO cards (id, title, description, rarity, type, collection, imageUrl, imagePrompt, variant, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      card.id,
      card.title,
      card.description,
      card.rarity,
      card.type,
      card.collection,
      card.imageUrl,
      card.imagePrompt,
      card.variant,
      card.createdAt,
      card.updatedAt,
    ]
  );

  return { success: true, data: card };
}

export async function updateCard(id: string, input: Partial<CardData>): Promise<ApiResponse<CardData>> {
  const existing = all<CardData>(`SELECT * FROM cards WHERE id = ? LIMIT 1`, [id])[0];
  if (!existing) return { success: false, error: 'Card not found' };

  // Ensure createdAt is a string (ISO) before binding
  const createdAtValue = input.createdAt
    ? (typeof input.createdAt === 'string' ? (() => { const d = new Date(input.createdAt as string); return isNaN(d.getTime()) ? String(input.createdAt) : d.toISOString(); })() : new Date(input.createdAt as any).toISOString())
    : existing.createdAt;

  const updatedAtValue = new Date().toISOString();

  const updated: CardData = {
    ...existing,
    ...input,
    id,
    createdAt: createdAtValue,
    updatedAt: updatedAtValue,
  };

  run(
    `UPDATE cards SET title = ?, description = ?, rarity = ?, type = ?, collection = ?, imageUrl = ?, imagePrompt = ?, variant = ?, createdAt = ?, updatedAt = ? WHERE id = ?`,
    [
      updated.title,
      updated.description,
      updated.rarity,
      updated.type,
      updated.collection,
      updated.imageUrl,
      updated.imagePrompt,
      updated.variant,
      updated.createdAt,
      updated.updatedAt,
      id,
    ]
  );

  return { success: true, data: updated };
}

export async function deleteCard(id: string): Promise<ApiResponse<{ message: string }>> {
  run(`DELETE FROM cards WHERE id = ?`, [id]);
  return { success: true, data: { message: 'Card deleted successfully' } };
}

function fallbackImage(prompt: string, cardType: string) {
  const keywords = `${prompt} ${cardType} fantasy game art`.
    toLowerCase().replace(/[^\w\s]/g, '').split(' ').filter(w => w.length > 2).slice(0, 5).join(',');
  return `https://source.unsplash.com/1024x1024/?${encodeURIComponent(keywords)}`;
}

export async function generateImage(prompt: string, cardType: string): Promise<ApiResponse<{ imageUrl: string; prompt: string; generatedAt: string }>> {
  return {
    success: true,
    data: { imageUrl: fallbackImage(prompt, cardType), prompt, generatedAt: new Date().toISOString() }
  };
}

export async function uploadImage(file: File): Promise<ApiResponse<{ imageUrl: string; fileName: string; uploadedAt: string }>> {
  const imageUrl = URL.createObjectURL(file);
  return { success: true, data: { imageUrl, fileName: file.name, uploadedAt: new Date().toISOString() } };
}

export async function getStats(): Promise<ApiResponse<{
  totalCards: number;
  rarityBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  collectionBreakdown: Record<string, number>;
  recentActivity: CardData[];
}>> {
  const cards = all<CardData>(`SELECT * FROM cards ORDER BY datetime(createdAt) DESC`);
  const rarityBreakdown: Record<string, number> = {};
  const typeBreakdown: Record<string, number> = {};
  const collectionBreakdown: Record<string, number> = {};
  for (const c of cards) {
    rarityBreakdown[c.rarity] = (rarityBreakdown[c.rarity] || 0) + 1;
    typeBreakdown[c.type] = (typeBreakdown[c.type] || 0) + 1;
    collectionBreakdown[c.collection] = (collectionBreakdown[c.collection] || 0) + 1;
  }
  return {
    success: true,
    data: {
      totalCards: cards.length,
      rarityBreakdown,
      typeBreakdown,
      collectionBreakdown,
      recentActivity: cards.slice(0, 5),
    },
  };
}
