export const RARITIES = {
  common: { 
    name: 'Common',
    color: '#9CA3AF', 
    border: '2px solid #6B7280',
    bgGradient: 'from-gray-100 to-gray-200'
  },
  rare: { 
    name: 'Rare',
    color: '#3B82F6', 
    border: '2px solid #1D4ED8',
    bgGradient: 'from-blue-100 to-blue-200'
  },
  epic: { 
    name: 'Epic',
    color: '#8B5CF6', 
    border: '3px solid #7C3AED',
    bgGradient: 'from-purple-100 to-purple-200'
  },
  legendary: { 
    name: 'Legendary',
    color: '#F59E0B', 
    border: '3px solid #D97706',
    bgGradient: 'from-orange-100 to-orange-200'
  },
  mythic: { 
    name: 'Mythic',
    color: '#EF4444', 
    border: '4px solid #DC2626', 
    glow: true,
    bgGradient: 'from-red-100 to-red-200'
  }
};

export const TYPES = {
  creature: { name: 'Creature', icon: '🐉' },
  spell: { name: 'Spell', icon: '✨' },
  artifact: { name: 'Artifact', icon: '⚔️' },
  enchantment: { name: 'Enchantment', icon: '🔮' }
};

export const VARIANTS = {
  normal: { name: 'Normal', effect: '' },
  shiny: { name: 'Shiny', effect: 'brightness-110 saturate-110' },
  holographic: { name: 'Holographic', effect: 'animate-pulse' },
  'first-edition': { name: 'First Edition', effect: 'sepia-[0.1]' }
};

export const CARD_TEMPLATES = {
  classic: { name: 'Classic', style: 'rounded-lg' },
  modern: { name: 'Modern', style: 'rounded-xl' },
  vintage: { name: 'Vintage', style: 'rounded-sm' }
};

export const AI_PROMPTS = {
  creature: [
    "mystical dragon with glowing eyes",
    "ancient forest guardian",
    "ethereal phoenix rising from flames",
    "crystal golem with magical runes"
  ],
  spell: [
    "swirling magical energy vortex",
    "lightning bolt striking ground",
    "healing light from above",
    "dark shadow magic spreading"
  ],
  artifact: [
    "ancient magical sword with runes",
    "glowing crystal orb on pedestal",
    "ornate golden chalice",
    "mystical staff with gems"
  ],
  enchantment: [
    "magical aura surrounding landscape",
    "shimmering protective barrier",
    "mystical symbols floating in air",
    "enchanted forest with glowing plants"
  ]
};
