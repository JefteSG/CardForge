import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Save, Download, Trash2 } from 'lucide-react';
import { CardPreview } from './CardPreview';
import { AIImageGenerator } from './AIImageGenerator';
import { ExportDialog } from './ExportDialog';
import { RARITIES, TYPES, VARIANTS } from '../config/constants.js';

interface CardData {
  id: string;
  title: string;
  description: string;
  rarity: keyof typeof RARITIES;
  type: keyof typeof TYPES;
  collection: string;
  imageUrl: string;
  imagePrompt: string;
  variant: keyof typeof VARIANTS;
  createdAt: Date;
}

interface CardBuilderProps {
  initialCard?: Partial<CardData>;
  onSave?: (card: CardData) => void;
  onDelete?: (cardId: string) => void;
}

export function CardBuilder({ initialCard, onSave, onDelete }: CardBuilderProps) {
  const [card, setCard] = useState<CardData>({
    id: initialCard?.id || crypto.randomUUID(),
    title: initialCard?.title || '',
    description: initialCard?.description || '',
    rarity: initialCard?.rarity || 'common',
    type: initialCard?.type || 'creature',
    collection: initialCard?.collection || 'My Collection',
    imageUrl: initialCard?.imageUrl || '',
    imagePrompt: initialCard?.imagePrompt || '',
    variant: initialCard?.variant || 'normal',
    createdAt: initialCard?.createdAt || new Date()
  });

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const updateCard = (field: keyof CardData, value: any) => {
    setCard(prev => ({ ...prev, [field]: value }));
  };

  const handleImageGenerated = (imageUrl: string, prompt: string) => {
    updateCard('imageUrl', imageUrl);
    updateCard('imagePrompt', prompt);
    setIsGeneratingImage(false);
  };

  const handleSave = () => {
    onSave?.(card);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this card?')) {
      onDelete?.(card.id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Card Builder Form */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Card Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Card Title</Label>
                <Input
                  id="title"
                  value={card.title}
                  onChange={(e) => updateCard('title', e.target.value)}
                  placeholder="Enter card name..."
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={card.description}
                  onChange={(e) => updateCard('description', e.target.value)}
                  placeholder="Describe the card's effect or lore..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="collection">Collection</Label>
                <Input
                  id="collection"
                  value={card.collection}
                  onChange={(e) => updateCard('collection', e.target.value)}
                  placeholder="Collection name..."
                />
              </div>
            </div>

            <Separator />

            {/* Card Properties */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Card Type</Label>
                <Select 
                  value={card.type} 
                  onValueChange={(value) => updateCard('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPES).map(([key, type]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Rarity</Label>
                <Select 
                  value={card.rarity} 
                  onValueChange={(value) => updateCard('rarity', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RARITIES).map(([key, rarity]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: rarity.color }}
                          />
                          <span>{rarity.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Variant</Label>
              <Select 
                value={card.variant} 
                onValueChange={(value) => updateCard('variant', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VARIANTS).map(([key, variant]) => (
                    <SelectItem key={key} value={key}>
                      {variant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* AI Image Generation */}
            <div>
              <Label>Artwork Generation</Label>
              <AIImageGenerator
                cardType={card.type}
                onImageGenerated={handleImageGenerated}
                currentPrompt={card.imagePrompt}
                isGenerating={isGeneratingImage}
              />
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Card
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowExportDialog(true)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {onDelete && (
                <Button variant="destructive" size="icon" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card Preview */}
      <div className="space-y-4">
        <div className="sticky top-4">
          <Label>Live Preview</Label>
          <div className="mt-2 flex justify-center">
            <CardPreview card={card} />
          </div>
          
          {/* Card Stats */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary">{TYPES[card.type].name}</Badge>
              <Badge style={{ backgroundColor: RARITIES[card.rarity].color, color: 'white' }}>
                {RARITIES[card.rarity].name}
              </Badge>
              {card.variant !== 'normal' && (
                <Badge variant="outline">{VARIANTS[card.variant].name}</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Created: {card.createdAt.toLocaleDateString()}</p>
              <p>ID: {card.id.slice(0, 8)}...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          card={card}
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
        />
      )}
    </div>
  );
}
