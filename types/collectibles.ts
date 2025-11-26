/**
 * Collectibles System Types
 * Animal Crossing-style collecting: Fish, Bugs, Fossils, Flowers
 */

import { Vector3 } from './game';

// ============================================
// Fish System
// ============================================

export const FISH_SIZES = ['tiny', 'small', 'medium', 'large', 'huge'] as const;
export type FishSize = typeof FISH_SIZES[number];

export const FISH_LOCATIONS = ['pond', 'river', 'ocean', 'fountain'] as const;
export type FishLocation = typeof FISH_LOCATIONS[number];

export interface Fish {
  id: string;
  name: string;
  nameEs: string; // Spanish name for your IG audience
  icon: string;
  size: FishSize;
  location: FishLocation;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  price: number; // Sell price
  shadowSize: number; // Visual indicator in water
  activeHours: [number, number]; // 24h format [start, end]
  activeMonths: number[]; // 1-12
  description: string;
  descriptionEs: string;
  catchPhrase: string; // Fun phrase when caught
  catchPhraseEs: string;
}

export interface CaughtFish {
  fishId: string;
  caughtAt: number;
  size: number; // Actual size in cm
  isRecord: boolean;
  location: Vector3;
}

// ============================================
// Bug System
// ============================================

export const BUG_LOCATIONS = ['ground', 'tree', 'flower', 'air', 'underground', 'water_surface'] as const;
export type BugLocation = typeof BUG_LOCATIONS[number];

export interface Bug {
  id: string;
  name: string;
  nameEs: string;
  icon: string;
  location: BugLocation;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  price: number;
  speed: 'stationary' | 'slow' | 'medium' | 'fast';
  activeHours: [number, number];
  activeMonths: number[];
  weather?: 'sunny' | 'rain' | 'any';
  description: string;
  descriptionEs: string;
  catchPhrase: string;
  catchPhraseEs: string;
}

export interface CaughtBug {
  bugId: string;
  caughtAt: number;
  location: Vector3;
}

// ============================================
// Fossil System
// ============================================

export const FOSSIL_PARTS = ['skull', 'body', 'tail', 'complete'] as const;
export type FossilPart = typeof FOSSIL_PARTS[number];

export interface Fossil {
  id: string;
  name: string;
  nameEs: string;
  icon: string;
  dinoName: string; // Full dinosaur name
  part: FossilPart;
  setId: string; // Group fossils by dinosaur
  price: number;
  description: string;
  descriptionEs: string;
  funFact: string;
  funFactEs: string;
}

export interface FoundFossil {
  fossilId: string;
  foundAt: number;
  assessed: boolean; // Need to assess at museum
  location: Vector3;
}

// ============================================
// Flower & Gardening System
// ============================================

export const FLOWER_TYPES = [
  'rose', 'tulip', 'pansy', 'cosmos', 'lily',
  'hyacinth', 'windflower', 'mum', 'sunflower'
] as const;
export type FlowerType = typeof FLOWER_TYPES[number];

export const FLOWER_COLORS = [
  'red', 'yellow', 'white', 'orange', 'pink',
  'purple', 'blue', 'black', 'gold'
] as const;
export type FlowerColor = typeof FLOWER_COLORS[number];

export interface FlowerSpecies {
  id: string;
  type: FlowerType;
  color: FlowerColor;
  name: string;
  nameEs: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'hybrid';
  price: number;
  // Breeding parents (for hybrids)
  parents?: [string, string];
}

export interface PlantedFlower {
  id: string;
  speciesId: string;
  position: Vector3;
  plantedAt: number;
  wateredAt?: number;
  stage: 'seed' | 'sprout' | 'budding' | 'blooming';
  isWilting: boolean;
}

export interface GardenPlot {
  id: string;
  position: Vector3;
  flowers: PlantedFlower[];
  ownerId: string;
}

// ============================================
// Collection Progress
// ============================================

export interface CollectionProgress {
  fish: {
    caught: string[]; // Fish IDs
    donated: string[];
    records: Record<string, number>; // fishId -> size record
  };
  bugs: {
    caught: string[];
    donated: string[];
  };
  fossils: {
    found: string[];
    assessed: string[];
    donated: string[];
    completedSets: string[]; // Dinosaur set IDs
  };
  flowers: {
    discovered: string[]; // Species IDs
    bred: string[]; // Hybrid species created
  };
}

// ============================================
// Museum Types
// ============================================

export type MuseumSection = 'fish' | 'bugs' | 'fossils' | 'art';

export interface MuseumExhibit {
  section: MuseumSection;
  itemId: string;
  donatedAt: number;
  donatedBy: string;
}

export interface MuseumStats {
  totalDonations: number;
  fishCount: number;
  bugCount: number;
  fossilCount: number;
  completionPercentage: number;
}

// ============================================
// Tool Types
// ============================================

export const TOOL_TYPES = ['fishing_rod', 'net', 'shovel', 'watering_can', 'axe'] as const;
export type ToolType = typeof TOOL_TYPES[number];

export interface Tool {
  type: ToolType;
  name: string;
  nameEs: string;
  icon: string;
  durability: number;
  maxDurability: number;
  tier: 'flimsy' | 'regular' | 'golden';
}

export interface PlayerTools {
  equipped: ToolType | null;
  inventory: Tool[];
}

// ============================================
// Activity States
// ============================================

export interface FishingState {
  isActive: boolean;
  castPosition: Vector3 | null;
  fishOnHook: Fish | null;
  tension: number; // 0-100, for minigame
  stage: 'idle' | 'casting' | 'waiting' | 'bite' | 'reeling' | 'caught' | 'escaped';
}

export interface BugCatchingState {
  isActive: boolean;
  targetBug: Bug | null;
  swingCooldown: number;
  stage: 'idle' | 'sneaking' | 'swinging' | 'caught' | 'missed';
}

export interface DiggingState {
  isActive: boolean;
  targetSpot: Vector3 | null;
  stage: 'idle' | 'digging' | 'found';
}

// ============================================
// Spawn Configuration
// ============================================

export interface SpawnPoint {
  id: string;
  type: 'fish' | 'bug' | 'fossil' | 'flower';
  position: Vector3;
  activeHours?: [number, number];
  weather?: 'sunny' | 'rain' | 'any';
  respawnTime: number; // Seconds until respawn
  lastSpawn?: number;
}

// ============================================
// Critterpedia Entry (Collection Log)
// ============================================

export interface CritterpediaEntry {
  id: string;
  type: 'fish' | 'bug';
  firstCaught: number;
  timesCaught: number;
  largestSize?: number; // For fish
  donated: boolean;
  favorite: boolean;
}
