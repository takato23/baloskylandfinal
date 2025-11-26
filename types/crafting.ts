/**
 * Crafting & DIY Recipe System
 * Animal Crossing-style crafting with materials and recipes
 */

import { Vector3 } from './game';

// ============================================
// Materials System
// ============================================

export const MATERIAL_TYPES = [
  // Wood
  'wood', 'softwood', 'hardwood', 'bamboo',
  // Stone & Metal
  'stone', 'clay', 'iron_nugget', 'gold_nugget',
  // Nature
  'tree_branch', 'weed', 'flower_petal', 'mushroom',
  // Seasonal
  'snowflake', 'cherry_petal', 'maple_leaf', 'acorn', 'pinecone',
  // Special
  'star_fragment', 'pearl', 'summer_shell', 'coral',
  // Crafted basics
  'wood_plank', 'brick', 'glass'
] as const;
export type MaterialType = typeof MATERIAL_TYPES[number];

export interface Material {
  id: MaterialType;
  name: string;
  nameEs: string;
  icon: string;
  description: string;
  descriptionEs: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'seasonal';
  sellPrice: number;
  stackSize: number;
  source: string[]; // Where to find it
}

export interface MaterialStack {
  materialId: MaterialType;
  quantity: number;
}

// ============================================
// Recipe System
// ============================================

export const RECIPE_CATEGORIES = [
  'furniture', 'decoration', 'tool', 'clothing',
  'wallpaper', 'flooring', 'seasonal', 'special'
] as const;
export type RecipeCategory = typeof RECIPE_CATEGORIES[number];

export interface Recipe {
  id: string;
  name: string;
  nameEs: string;
  icon: string;
  description: string;
  descriptionEs: string;
  category: RecipeCategory;
  materials: MaterialStack[];
  craftTime: number; // Seconds
  resultItemId: string;
  resultQuantity: number;
  unlockMethod: 'default' | 'bottle' | 'villager' | 'event' | 'shop' | 'achievement';
  unlockSource?: string;
  isSeasonal?: boolean;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
}

export interface LearnedRecipe {
  recipeId: string;
  learnedAt: number;
  timesCrafted: number;
  favorite: boolean;
}

// ============================================
// Crafting State
// ============================================

export interface CraftingState {
  isOpen: boolean;
  selectedRecipe: Recipe | null;
  craftingProgress: number; // 0-100
  isCrafting: boolean;
  workbenchPosition: Vector3 | null;
}

// ============================================
// Furniture & Decoration Items
// ============================================

export const FURNITURE_SIZES = ['1x1', '1x2', '2x1', '2x2', '3x3'] as const;
export type FurnitureSize = typeof FURNITURE_SIZES[number];

export const PLACEMENT_TYPES = ['floor', 'wall', 'table', 'ceiling', 'outdoor'] as const;
export type PlacementType = typeof PLACEMENT_TYPES[number];

export interface FurnitureItem {
  id: string;
  name: string;
  nameEs: string;
  icon: string;
  description: string;
  descriptionEs: string;
  category: 'furniture' | 'decoration' | 'appliance' | 'plant' | 'lighting';
  size: FurnitureSize;
  placement: PlacementType[];
  canCustomize: boolean;
  customizeOptions?: string[]; // Color variants
  interactable: boolean;
  interactionType?: 'sit' | 'use' | 'toggle' | 'music';
  sellPrice: number;
  buyPrice?: number;
  isNookMiles?: boolean;
  nookMilesPrice?: number;
  setId?: string; // Part of a furniture set
}

// ============================================
// Home Decoration System
// ============================================

export interface PlacedItem {
  id: string;
  itemId: string;
  position: Vector3;
  rotation: number; // Y-axis rotation
  customization?: string; // Applied customization
}

export interface Room {
  id: string;
  name: string;
  nameEs: string;
  size: '4x4' | '6x6' | '8x8';
  wallpaper?: string;
  flooring?: string;
  items: PlacedItem[];
}

export interface PlayerHome {
  ownerId: string;
  level: number; // 1-5, determines size and rooms
  rooms: Room[];
  exterior: {
    roofColor: string;
    wallColor: string;
    doorStyle: string;
    mailbox: string;
  };
  garden: {
    items: PlacedItem[];
    flowers: string[]; // PlantedFlower IDs
  };
  visitors: number;
  lastVisited?: number;
}

// ============================================
// Inventory System
// ============================================

export interface InventorySlot {
  itemId: string;
  itemType: 'material' | 'furniture' | 'clothing' | 'tool' | 'collectible' | 'special';
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface PlayerInventory {
  slots: InventorySlot[];
  maxSlots: number;
  pocketExpansions: number;
}

// ============================================
// Storage System
// ============================================

export interface StorageUnit {
  id: string;
  type: 'home' | 'locker' | 'museum';
  slots: InventorySlot[];
  maxSlots: number;
}

// ============================================
// Workbench Types
// ============================================

export interface Workbench {
  id: string;
  position: Vector3;
  type: 'basic' | 'diy' | 'mini' | 'outdoor';
  ownerId?: string;
}

// ============================================
// Catalog System (Nook Shopping)
// ============================================

export interface CatalogEntry {
  itemId: string;
  itemType: 'furniture' | 'clothing' | 'wallpaper' | 'flooring';
  firstObtained: number;
  source: 'bought' | 'crafted' | 'gift' | 'found';
  canReorder: boolean;
}

export interface PlayerCatalog {
  entries: CatalogEntry[];
  wishlist: string[]; // Item IDs
}

// ============================================
// Pre-defined Materials Data
// ============================================

export const MATERIALS_DATA: Material[] = [
  // Wood types
  { id: 'wood', name: 'Wood', nameEs: 'Madera', icon: '🪵', description: 'Regular wood from trees', descriptionEs: 'Madera normal de árboles', rarity: 'common', sellPrice: 60, stackSize: 30, source: ['trees'] },
  { id: 'softwood', name: 'Softwood', nameEs: 'Madera Blanda', icon: '🪵', description: 'Soft, light wood', descriptionEs: 'Madera blanda y ligera', rarity: 'common', sellPrice: 60, stackSize: 30, source: ['trees'] },
  { id: 'hardwood', name: 'Hardwood', nameEs: 'Madera Dura', icon: '🪵', description: 'Dense, sturdy wood', descriptionEs: 'Madera densa y resistente', rarity: 'common', sellPrice: 60, stackSize: 30, source: ['trees'] },
  { id: 'bamboo', name: 'Bamboo', nameEs: 'Bambú', icon: '🎋', description: 'Hollow bamboo stalks', descriptionEs: 'Tallos huecos de bambú', rarity: 'uncommon', sellPrice: 80, stackSize: 30, source: ['bamboo_trees'] },

  // Stone & Metal
  { id: 'stone', name: 'Stone', nameEs: 'Piedra', icon: '🪨', description: 'Basic stone', descriptionEs: 'Piedra básica', rarity: 'common', sellPrice: 75, stackSize: 30, source: ['rocks'] },
  { id: 'clay', name: 'Clay', nameEs: 'Arcilla', icon: '🏺', description: 'Moldable clay', descriptionEs: 'Arcilla moldeable', rarity: 'common', sellPrice: 100, stackSize: 30, source: ['rocks'] },
  { id: 'iron_nugget', name: 'Iron Nugget', nameEs: 'Pepita de Hierro', icon: '⚫', description: 'Valuable iron ore', descriptionEs: 'Valioso mineral de hierro', rarity: 'uncommon', sellPrice: 375, stackSize: 30, source: ['rocks'] },
  { id: 'gold_nugget', name: 'Gold Nugget', nameEs: 'Pepita de Oro', icon: '🟡', description: 'Precious gold!', descriptionEs: 'Oro precioso!', rarity: 'rare', sellPrice: 10000, stackSize: 30, source: ['rocks', 'balloons'] },

  // Nature
  { id: 'tree_branch', name: 'Tree Branch', nameEs: 'Rama', icon: '🌿', description: 'Fallen branch', descriptionEs: 'Rama caída', rarity: 'common', sellPrice: 5, stackSize: 30, source: ['ground', 'trees'] },
  { id: 'weed', name: 'Clump of Weeds', nameEs: 'Hierbajo', icon: '🌾', description: 'Common weeds', descriptionEs: 'Hierbajos comunes', rarity: 'common', sellPrice: 10, stackSize: 99, source: ['ground'] },
  { id: 'flower_petal', name: 'Flower Petal', nameEs: 'Pétalo', icon: '🌸', description: 'Colorful petal', descriptionEs: 'Pétalo colorido', rarity: 'common', sellPrice: 20, stackSize: 10, source: ['flowers'] },
  { id: 'mushroom', name: 'Mushroom', nameEs: 'Hongo', icon: '🍄', description: 'Forest mushroom', descriptionEs: 'Hongo del bosque', rarity: 'seasonal', sellPrice: 200, stackSize: 10, source: ['trees', 'ground'] },

  // Seasonal
  { id: 'snowflake', name: 'Snowflake', nameEs: 'Copo de Nieve', icon: '❄️', description: 'Winter snowflake', descriptionEs: 'Copo de nieve invernal', rarity: 'seasonal', sellPrice: 200, stackSize: 10, source: ['air'] },
  { id: 'cherry_petal', name: 'Cherry Petal', nameEs: 'Pétalo de Cerezo', icon: '🌸', description: 'Spring cherry blossom', descriptionEs: 'Flor de cerezo primaveral', rarity: 'seasonal', sellPrice: 200, stackSize: 10, source: ['air'] },
  { id: 'maple_leaf', name: 'Maple Leaf', nameEs: 'Hoja de Arce', icon: '🍁', description: 'Autumn maple leaf', descriptionEs: 'Hoja de arce otoñal', rarity: 'seasonal', sellPrice: 200, stackSize: 10, source: ['air'] },
  { id: 'acorn', name: 'Acorn', nameEs: 'Bellota', icon: '🌰', description: 'Oak tree acorn', descriptionEs: 'Bellota de roble', rarity: 'seasonal', sellPrice: 200, stackSize: 30, source: ['trees'] },
  { id: 'pinecone', name: 'Pine Cone', nameEs: 'Piña', icon: '🌲', description: 'Pine tree cone', descriptionEs: 'Piña de pino', rarity: 'seasonal', sellPrice: 200, stackSize: 30, source: ['pine_trees'] },

  // Special
  { id: 'star_fragment', name: 'Star Fragment', nameEs: 'Fragmento de Estrella', icon: '⭐', description: 'Fallen star piece', descriptionEs: 'Trozo de estrella caída', rarity: 'rare', sellPrice: 250, stackSize: 10, source: ['beach', 'wishes'] },
  { id: 'pearl', name: 'Pearl', nameEs: 'Perla', icon: '🤍', description: 'Precious pearl', descriptionEs: 'Perla preciosa', rarity: 'rare', sellPrice: 10000, stackSize: 10, source: ['diving'] },
  { id: 'summer_shell', name: 'Summer Shell', nameEs: 'Concha de Verano', icon: '🐚', description: 'Blue summer shell', descriptionEs: 'Concha azul de verano', rarity: 'seasonal', sellPrice: 600, stackSize: 30, source: ['beach'] },
  { id: 'coral', name: 'Coral', nameEs: 'Coral', icon: '🪸', description: 'Pink coral', descriptionEs: 'Coral rosa', rarity: 'uncommon', sellPrice: 500, stackSize: 30, source: ['beach'] },
];

// ============================================
// Pre-defined Starter Recipes
// ============================================

export const STARTER_RECIPES: Recipe[] = [
  {
    id: 'flimsy_fishing_rod',
    name: 'Flimsy Fishing Rod',
    nameEs: 'Caña Endeble',
    icon: '🎣',
    description: 'A basic fishing rod',
    descriptionEs: 'Una caña de pescar básica',
    category: 'tool',
    materials: [{ materialId: 'tree_branch', quantity: 5 }],
    craftTime: 3,
    resultItemId: 'flimsy_fishing_rod',
    resultQuantity: 1,
    unlockMethod: 'default',
  },
  {
    id: 'flimsy_net',
    name: 'Flimsy Net',
    nameEs: 'Red Endeble',
    icon: '🥅',
    description: 'A basic bug net',
    descriptionEs: 'Una red básica para insectos',
    category: 'tool',
    materials: [{ materialId: 'tree_branch', quantity: 5 }],
    craftTime: 3,
    resultItemId: 'flimsy_net',
    resultQuantity: 1,
    unlockMethod: 'default',
  },
  {
    id: 'flimsy_shovel',
    name: 'Flimsy Shovel',
    nameEs: 'Pala Endeble',
    icon: '⛏️',
    description: 'A basic shovel',
    descriptionEs: 'Una pala básica',
    category: 'tool',
    materials: [{ materialId: 'tree_branch', quantity: 5 }, { materialId: 'hardwood', quantity: 1 }],
    craftTime: 3,
    resultItemId: 'flimsy_shovel',
    resultQuantity: 1,
    unlockMethod: 'default',
  },
  {
    id: 'watering_can',
    name: 'Watering Can',
    nameEs: 'Regadera',
    icon: '🚿',
    description: 'Water your flowers',
    descriptionEs: 'Riega tus flores',
    category: 'tool',
    materials: [{ materialId: 'softwood', quantity: 5 }, { materialId: 'iron_nugget', quantity: 1 }],
    craftTime: 5,
    resultItemId: 'watering_can',
    resultQuantity: 1,
    unlockMethod: 'default',
  },
  {
    id: 'wooden_chair',
    name: 'Wooden Chair',
    nameEs: 'Silla de Madera',
    icon: '🪑',
    description: 'Simple wooden chair',
    descriptionEs: 'Silla de madera simple',
    category: 'furniture',
    materials: [{ materialId: 'wood', quantity: 6 }],
    craftTime: 5,
    resultItemId: 'wooden_chair',
    resultQuantity: 1,
    unlockMethod: 'default',
  },
  {
    id: 'wooden_table',
    name: 'Wooden Table',
    nameEs: 'Mesa de Madera',
    icon: '🪵',
    description: 'Simple wooden table',
    descriptionEs: 'Mesa de madera simple',
    category: 'furniture',
    materials: [{ materialId: 'wood', quantity: 8 }],
    craftTime: 5,
    resultItemId: 'wooden_table',
    resultQuantity: 1,
    unlockMethod: 'default',
  },
  {
    id: 'campfire',
    name: 'Campfire',
    nameEs: 'Fogata',
    icon: '🔥',
    description: 'Cozy campfire',
    descriptionEs: 'Fogata acogedora',
    category: 'decoration',
    materials: [{ materialId: 'tree_branch', quantity: 3 }, { materialId: 'stone', quantity: 5 }],
    craftTime: 4,
    resultItemId: 'campfire',
    resultQuantity: 1,
    unlockMethod: 'default',
  },
  {
    id: 'flower_wreath',
    name: 'Flower Wreath',
    nameEs: 'Corona de Flores',
    icon: '💐',
    description: 'Beautiful door wreath',
    descriptionEs: 'Hermosa corona para puerta',
    category: 'decoration',
    materials: [{ materialId: 'flower_petal', quantity: 10 }, { materialId: 'weed', quantity: 5 }],
    craftTime: 6,
    resultItemId: 'flower_wreath',
    resultQuantity: 1,
    unlockMethod: 'default',
  },
];
