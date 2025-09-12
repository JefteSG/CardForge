import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CardPreview } from './CardPreview';
import { Search, Filter, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { RARITIES, TYPES } from '../config/constants.js';

interface CardData {
  id: string;
  title: string;
  description: string;
  rarity: keyof typeof RARITIES;
  type: keyof typeof TYPES;
  collection: string;
  imageUrl: string;
  imagePrompt: string;
  variant: string;
  createdAt: Date;
}

interface CardGalleryProps {
  cards: CardData[];
  onCreateNew: () => void;
  onEditCard: (card: CardData) => void;
  onDeleteCard: (cardId: string) => void;
  onViewCard: (card: CardData) => void;
}

export function CardGallery({ 
  cards, 
  onCreateNew, 
  onEditCard, 
  onDeleteCard, 
  onViewCard 
}: CardGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'rarity' | 'type' | 'date'>('date');

  const filteredCards = cards
    .filter(card => {
      const matchesSearch = card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.collection.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRarity = filterRarity === 'all' || card.rarity === filterRarity;
      const matchesType = filterType === 'all' || card.type === filterType;
      
      return matchesSearch && matchesRarity && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'rarity':
          const rarityOrder = ['common', 'rare', 'epic', 'legendary', 'mythic'];
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const getRarityStats = () => {
    const stats = cards.reduce((acc, card) => {
      acc[card.rarity] = (acc[card.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(RARITIES).map(([key, rarity]) => ({
      key,
      name: rarity.name,
      color: rarity.color,
      count: stats[key] || 0
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Card Gallery</h1>
          <p className="text-muted-foreground">
            {cards.length} card{cards.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Card
        </Button>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {getRarityStats().map(stat => (
              <div key={stat.key} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />
                <span className="text-sm">
                  {stat.name}: <span className="font-medium">{stat.count}</span>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterRarity} onValueChange={setFilterRarity}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by rarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rarities</SelectItem>
                {Object.entries(RARITIES).map(([key, rarity]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: rarity.color }}
                      />
                      {rarity.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(TYPES).map(([key, type]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      {type.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="title">Sort by Title</SelectItem>
                <SelectItem value="rarity">Sort by Rarity</SelectItem>
                <SelectItem value="type">Sort by Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {cards.length === 0 ? 'No cards in your collection yet.' : 'No cards match your filters.'}
          </div>
          {cards.length === 0 && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Card
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCards.map(card => (
            <div key={card.id} className="group relative">
              <CardPreview card={card} />
              
              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onViewCard(card)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onEditCard(card)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this card?')) {
                      onDeleteCard(card.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Card Info */}
              <div className="mt-2 space-y-1">
                <h3 className="font-medium truncate">{card.title}</h3>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ backgroundColor: `${RARITIES[card.rarity].color}20`, color: RARITIES[card.rarity].color }}
                  >
                    {RARITIES[card.rarity].name}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {TYPES[card.type].icon} {TYPES[card.type].name}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {card.collection}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
