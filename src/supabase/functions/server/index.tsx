import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from "./kv_store.tsx";
import { aiImageService } from './ai-service.tsx';

const app = new Hono();

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize storage bucket on startup
async function initializeStorage() {
  const bucketName = 'make-52ad7d0c-card-images';
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log('Creating storage bucket...');
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
      } else {
        console.log('Storage bucket created successfully');
      }
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Initialize on startup
initializeStorage();

// Health check endpoint
app.get("/make-server-52ad7d0c/health", (c) => {
  return c.json({ status: "ok" });
});

// Cards CRUD endpoints
app.get("/make-server-52ad7d0c/cards", async (c) => {
  try {
    const cards = await kv.getByPrefix('card:');
    const cardData = cards.map(card => JSON.parse(card.value));
    
    return c.json({ 
      success: true, 
      data: cardData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return c.json({ success: false, error: 'Failed to fetch cards' }, 500);
  }
});

app.get("/make-server-52ad7d0c/cards/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const cardData = await kv.get(`card:${id}`);
    
    if (!cardData) {
      return c.json({ success: false, error: 'Card not found' }, 404);
    }
    
    return c.json({ success: true, data: JSON.parse(cardData) });
  } catch (error) {
    console.error('Error fetching card:', error);
    return c.json({ success: false, error: 'Failed to fetch card' }, 500);
  }
});

app.post("/make-server-52ad7d0c/cards", async (c) => {
  try {
    const cardData = await c.req.json();
    
    // Validate required fields
    if (!cardData.title || !cardData.type || !cardData.rarity) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: title, type, rarity' 
      }, 400);
    }
    
    // Add metadata
    const card = {
      ...cardData,
      id: cardData.id || crypto.randomUUID(),
      createdAt: cardData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`card:${card.id}`, JSON.stringify(card));
    
    return c.json({ success: true, data: card });
  } catch (error) {
    console.error('Error creating card:', error);
    return c.json({ success: false, error: 'Failed to create card' }, 500);
  }
});

app.put("/make-server-52ad7d0c/cards/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updateData = await c.req.json();
    
    const existingCard = await kv.get(`card:${id}`);
    if (!existingCard) {
      return c.json({ success: false, error: 'Card not found' }, 404);
    }
    
    const card = {
      ...JSON.parse(existingCard),
      ...updateData,
      id,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`card:${id}`, JSON.stringify(card));
    
    return c.json({ success: true, data: card });
  } catch (error) {
    console.error('Error updating card:', error);
    return c.json({ success: false, error: 'Failed to update card' }, 500);
  }
});

app.delete("/make-server-52ad7d0c/cards/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    const existingCard = await kv.get(`card:${id}`);
    if (!existingCard) {
      return c.json({ success: false, error: 'Card not found' }, 404);
    }
    
    // Delete the card data
    await kv.del(`card:${id}`);
    
    // TODO: Delete associated image from storage if needed
    
    return c.json({ success: true, message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Error deleting card:', error);
    return c.json({ success: false, error: 'Failed to delete card' }, 500);
  }
});

// AI Image Generation endpoint
app.post("/make-server-52ad7d0c/generate-image", async (c) => {
  try {
    const { prompt, cardType = 'creature', style = 'fantasy' } = await c.req.json();
    
    if (!prompt) {
      return c.json({ success: false, error: 'Prompt is required' }, 400);
    }
    
    console.log(`Generating AI image for prompt: "${prompt}" (type: ${cardType})`);
    
    // Use the AI service for image generation
    const aiResponse = await aiImageService.generateImage({
      prompt,
      cardType,
      style,
      size: '1024x1024'
    });
    
    return c.json({ 
      success: true, 
      data: { 
        imageUrl: aiResponse.imageUrl,
        prompt: prompt,
        revisedPrompt: aiResponse.revisedPrompt,
        generatedAt: aiResponse.generatedAt
      }
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return c.json({ success: false, error: 'Failed to generate image' }, 500);
  }
});

// Image upload endpoint for custom images
app.post("/make-server-52ad7d0c/upload-image", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return c.json({ success: false, error: 'No image file provided' }, 400);
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ success: false, error: 'File must be an image' }, 400);
    }
    
    // Upload to Supabase Storage
    const fileName = `${crypto.randomUUID()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage
      .from('make-52ad7d0c-card-images')
      .upload(fileName, file);
    
    if (error) {
      console.error('Storage upload error:', error);
      return c.json({ success: false, error: 'Failed to upload image' }, 500);
    }
    
    // Get signed URL for private access
    const { data: urlData, error: urlError } = await supabase.storage
      .from('make-52ad7d0c-card-images')
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days
    
    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      return c.json({ success: false, error: 'Failed to get image URL' }, 500);
    }
    
    return c.json({ 
      success: true, 
      data: { 
        imageUrl: urlData.signedUrl,
        fileName: fileName,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return c.json({ success: false, error: 'Failed to upload image' }, 500);
  }
});

// Helper function to generate fallback images using image services
async function generateFallbackImage(prompt: string, cardType: string): Promise<string> {
  // Extract keywords for better search results
  const keywords = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 2)
    .slice(0, 3)
    .join(',');
  
  // Combine with card type for more relevant results
  const searchTerm = `${keywords},${cardType},fantasy,game,art`;
  
  // Use Unsplash as fallback (in production, replace with AI service)
  return `https://source.unsplash.com/800x600/?${searchTerm}`;
}

// Export endpoint for cards
app.get("/make-server-52ad7d0c/cards/:id/export", async (c) => {
  try {
    const id = c.req.param('id');
    const format = c.req.query('format') || 'json';
    
    const cardData = await kv.get(`card:${id}`);
    if (!cardData) {
      return c.json({ success: false, error: 'Card not found' }, 404);
    }
    
    const card = JSON.parse(cardData);
    
    if (format === 'json') {
      return c.json({
        success: true,
        data: {
          ...card,
          exportedAt: new Date().toISOString(),
          exportFormat: 'json'
        }
      });
    }
    
    // For other formats, return the card data for client-side processing
    return c.json({
      success: true,
      data: card,
      format: format
    });
  } catch (error) {
    console.error('Error exporting card:', error);
    return c.json({ success: false, error: 'Failed to export card' }, 500);
  }
});

// Stats endpoint
app.get("/make-server-52ad7d0c/stats", async (c) => {
  try {
    const cards = await kv.getByPrefix('card:');
    const cardData = cards.map(card => JSON.parse(card.value));
    
    const stats = {
      totalCards: cardData.length,
      rarityBreakdown: {},
      typeBreakdown: {},
      collectionBreakdown: {},
      recentActivity: cardData
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    };
    
    // Calculate breakdowns
    cardData.forEach(card => {
      stats.rarityBreakdown[card.rarity] = (stats.rarityBreakdown[card.rarity] || 0) + 1;
      stats.typeBreakdown[card.type] = (stats.typeBreakdown[card.type] || 0) + 1;
      stats.collectionBreakdown[card.collection] = (stats.collectionBreakdown[card.collection] || 0) + 1;
    });
    
    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ success: false, error: 'Failed to fetch stats' }, 500);
  }
});

Deno.serve(app.fetch);
