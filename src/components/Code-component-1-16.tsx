import React from 'react';
import { RARITIES, TYPES, VARIANTS } from '../config/constants.js';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Card {
  title: string;
  description: string;
  rarity: keyof typeof RARITIES;
  type: keyof typeof TYPES;
  collection: string;
  imageUrl: string;
  imagePrompt: string;
  variant: keyof typeof VARIANTS;
}

interface CardPreviewProps {
  card: Card;
  className?: string;
}

export function CardPreview({ card, className = "" }: CardPreviewProps) {
  const rarity = RARITIES[card.rarity];
  const type = TYPES[card.type];
  const variant = VARIANTS[card.variant];

  const cardStyle = {
    border: rarity.border,
    boxShadow: rarity.glow ? `0 0 20px ${rarity.color}40` : 'none'
  };

  return (
    <div 
      className={`relative w-64 h-96 bg-gradient-to-b ${rarity.bgGradient} rounded-xl p-4 shadow-lg ${variant.effect} ${className}`}
      style={cardStyle}
    >
      {/* Rarity Indicator */}
      <div 
        className="absolute top-2 right-2 w-4 h-4 rounded-full"
        style={{ backgroundColor: rarity.color }}
        title={rarity.name}
      />

      {/* Card Title */}
      <div className="mb-2">
        <h3 className="font-bold text-gray-800 truncate">{card.title || "Card Name"}</h3>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <span>{type.icon}</span>
          <span>{type.name}</span>
        </div>
      </div>

      {/* Card Image */}
      <div className="w-full h-32 bg-gray-200 rounded-md mb-3 overflow-hidden">
        {card.imageUrl ? (
          <ImageWithFallback
            src={card.imageUrl}
            alt={card.title || "Card artwork"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">{type.icon}</span>
          </div>
        )}
      </div>

      {/* Card Description */}
      <div className="flex-1">
        <p className="text-sm text-gray-700 leading-tight line-clamp-4">
          {card.description || "Enter card description..."}
        </p>
      </div>

      {/* Card Footer */}
      <div className="mt-3 pt-2 border-t border-gray-300">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">{card.collection || "Collection"}</span>
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: rarity.color }}
            />
            <span className="text-xs" style={{ color: rarity.color }}>
              {rarity.name}
            </span>
          </div>
        </div>
      </div>

      {/* Variant Badge */}
      {card.variant !== 'normal' && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {variant.name}
        </div>
      )}
    </div>
  );
}
