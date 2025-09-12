import { Hono } from 'hono';
import { initDB, all, run } from './db';
import fs from 'fs';
import path from 'path';

const app = new Hono();

app.get('/api/health', (c) => c.json({ status: 'ok-local-server' }));

app.get('/api/cards', async (c) => {
  await initDB();
  const cards = all(`SELECT * FROM cards ORDER BY datetime(createdAt) DESC`);
  return c.json({ success: true, data: cards });
});

app.get('/api/cards/:id', async (c) => {
  await initDB();
  const id = c.req.param('id');
  const rows = all(`SELECT * FROM cards WHERE id = ? LIMIT 1`, [id]);
  if (!rows[0]) return c.json({ success: false, error: 'Card not found' }, 404);
  return c.json({ success: true, data: rows[0] });
});

app.post('/api/cards', async (c) => {
  await initDB();
  const input = await c.req.json();
  if (!input.title || !input.type || !input.rarity) return c.json({ success: false, error: 'Missing required fields' }, 400);
  const id = input.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const card = {
    id,
    title: input.title,
    description: input.description || '',
    rarity: input.rarity,
    type: input.type,
    collection: input.collection || 'Default',
    imageUrl: input.imageUrl || '',
    imagePrompt: input.imagePrompt || '',
    variant: input.variant || 'normal',
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
  run(`INSERT INTO cards (id, title, description, rarity, type, collection, imageUrl, imagePrompt, variant, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [card.id, card.title, card.description, card.rarity, card.type, card.collection, card.imageUrl, card.imagePrompt, card.variant, card.createdAt, card.updatedAt]);
  return c.json({ success: true, data: card });
});

app.put('/api/cards/:id', async (c) => {
  await initDB();
  const id = c.req.param('id');
  const existing = all(`SELECT * FROM cards WHERE id = ? LIMIT 1`, [id])[0];
  if (!existing) return c.json({ success: false, error: 'Card not found' }, 404);
  const input = await c.req.json();
  const updated = { ...existing, ...input, id, updatedAt: new Date().toISOString() };
  run(`UPDATE cards SET title = ?, description = ?, rarity = ?, type = ?, collection = ?, imageUrl = ?, imagePrompt = ?, variant = ?, createdAt = ?, updatedAt = ? WHERE id = ?`,
      [updated.title, updated.description, updated.rarity, updated.type, updated.collection, updated.imageUrl, updated.imagePrompt, updated.variant, updated.createdAt, updated.updatedAt, id]);
  return c.json({ success: true, data: updated });
});

app.delete('/api/cards/:id', async (c) => {
  await initDB();
  const id = c.req.param('id');
  run(`DELETE FROM cards WHERE id = ?`, [id]);
  return c.json({ success: true, message: 'Card deleted successfully' });
});

function fallbackImage(prompt: string, cardType: string) {
  const keywords = `${prompt} ${cardType} fantasy game art`.toLowerCase().replace(/[^\w\s]/g, '').split(' ').filter(w => w.length > 2).slice(0, 5).join(',');
  return `https://source.unsplash.com/1024x1024/?${encodeURIComponent(keywords)}`;
}

app.post('/api/generate-image', async (c) => {
  const { prompt, cardType = 'creature' } = await c.req.json();
  if (!prompt) return c.json({ success: false, error: 'Prompt is required' }, 400);
  return c.json({ success: true, data: { imageUrl: fallbackImage(prompt, cardType), prompt, generatedAt: new Date().toISOString() } });
});

app.post('/api/upload-image', async (c) => {
  const form = await c.req.formData();
  const file = form.get('image') as File | null;
  if (!file) return c.json({ success: false, error: 'No image file provided' }, 400);
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const filename = `${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  fs.writeFileSync(path.join(uploadsDir, filename), Buffer.from(arrayBuffer));
  return c.json({ success: true, data: { imageUrl: `/uploads/${filename}`, fileName: filename, uploadedAt: new Date().toISOString() } });
});

app.get('/api/stats', async (c) => {
  await initDB();
  const cards: any[] = all(`SELECT * FROM cards`);
  const rarityBreakdown: Record<string, number> = {};
  const typeBreakdown: Record<string, number> = {};
  const collectionBreakdown: Record<string, number> = {};
  for (const card of cards) {
    rarityBreakdown[card.rarity] = (rarityBreakdown[card.rarity] || 0) + 1;
    typeBreakdown[card.type] = (typeBreakdown[card.type] || 0) + 1;
    collectionBreakdown[card.collection] = (collectionBreakdown[card.collection] || 0) + 1;
  }
  const recentActivity = cards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  return c.json({ success: true, data: { totalCards: cards.length, rarityBreakdown, typeBreakdown, collectionBreakdown, recentActivity } });
});

export default app;
