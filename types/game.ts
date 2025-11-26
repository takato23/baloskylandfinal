/**
 * Core Game Types
 * Shared TypeScript definitions for the entire application
 */

import { RefObject } from 'react';
import { RapierRigidBody } from '@react-three/rapier';

// ============================================
// Basic Types
// ============================================

export type Vector3 = [number, number, number];
export type Quaternion = [number, number, number, number];
export type RGBColor = string; // hex color like '#ff0000'

// ============================================
// Character Types
// ============================================

export const ANIMAL_TYPES = [
  'bear', 'cat', 'rabbit', 'fox', 'dog', 'panda', 'koala', 'lion', 'pig',
  'chicken', 'elephant', 'sheep', 'penguin', 'duck', 'zebra', 'mouse',
  'cow', 'frog', 'monkey', 'tiger', 'raccoon', 'deer', 'hedgehog', 'beaver', 'platypus'
] as const;

export type AnimalType = typeof ANIMAL_TYPES[number];

export const ACCESSORY_TYPES = [
  'none', 'backpack', 'glasses', 'hat', 'mate', 'phone', 'scarf',
  // Nuevos accesorios argentinos
  'boina', 'gorraArgentina', 'banderin', 'alfajor', 'termo', 'camisetaArg'
] as const;
export type AccessoryType = typeof ACCESSORY_TYPES[number];

export interface CharacterAppearance {
  type: AnimalType;
  skin: RGBColor;
  shirt: RGBColor;
  pants: RGBColor;
  accessory: AccessoryType;
}

export const DEFAULT_CHARACTER: CharacterAppearance = {
  type: 'bear',
  skin: '#fcd5ce',
  shirt: '#FF9A8B',
  pants: '#4a90e2',
  accessory: 'backpack',
};

// ============================================
// Player State Types
// ============================================

export interface PlayerState {
  position: Vector3;
  isMoving: boolean;
  isRunning: boolean;
  isGrounded: boolean;
  isSitting: boolean;
  isDriving: boolean;
  isHolding: boolean;
}

export interface SittingState {
  isSitting: boolean;
  target: Vector3 | null;
  rotation: Vector3 | null;
}

// ============================================
// Environment Types
// ============================================

export const WEATHER_TYPES = ['sunny', 'rain', 'snow'] as const;
export type WeatherType = typeof WEATHER_TYPES[number];

export const TRAFFIC_STATES = ['NS_GREEN', 'NS_YELLOW', 'ALL_RED', 'EW_GREEN', 'EW_YELLOW'] as const;
export type TrafficState = typeof TRAFFIC_STATES[number];

export interface EnvironmentState {
  isNight: boolean;
  weather: WeatherType;
  trafficState: TrafficState;
}

// ============================================
// NPC & Dialogue Types
// ============================================

export const VOICE_NAMES = ['Puck', 'Kore', 'Fenrir', 'Charon', 'Zephyr'] as const;
export type VoiceName = typeof VOICE_NAMES[number];

export interface NpcConfig {
  name: string;
  systemInstruction: string;
  voiceName: VoiceName;
  greeting: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'npc';
  text: string;
  timestamp: number;
}

export interface DialogueState {
  isOpen: boolean;
  title: string;
  text: string;
}

export type LiveConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface LiveSessionState {
  isOpen: boolean;
  npc: NpcConfig | null;
  messages: ChatMessage[];
}

// ============================================
// Input Types
// ============================================

export interface JoystickState {
  x: number;
  y: number;
  active: boolean;
}

export interface MobileButtonState {
  jump: boolean;
  run: boolean;
  interact: boolean;
  horn: boolean;
}

export interface MobileInputState {
  joystick: JoystickState;
  buttons: MobileButtonState;
}

export interface GameInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  run: boolean;
  interact: boolean;
  horn: boolean;
}

// ============================================
// Physics Types
// ============================================

export interface PhysicsRef {
  body: RefObject<RapierRigidBody>;
}

// ============================================
// Audio Types
// ============================================

export const SOUND_TYPES = [
  'coin', 'jump', 'step', 'gem', 'rustle', 'bird',
  'cricket', 'car', 'horn', 'skid', 'rolling'
] as const;

export type SoundType = typeof SOUND_TYPES[number];

// ============================================
// Emote System Types
// ============================================

export const EMOTE_TYPES = [
  'wave', 'love', 'laugh', 'celebrate', 'thumbsup',
  'fire', 'star', 'gaming', 'chat', 'photo'
] as const;

export type EmoteType = typeof EMOTE_TYPES[number];

export interface EmoteData {
  id: string;
  emoji: string;
  action: EmoteType;
  timestamp: number;
  queueIndex?: number;
}

export interface PlayerEmote {
  userId: string;
  username: string;
  emote: string;
  action: EmoteType;
  position: Vector3;
  timestamp: number;
}

// ============================================
// Utility Functions
// ============================================

export function isValidVector3(v: unknown): v is Vector3 {
  return Array.isArray(v) &&
    v.length === 3 &&
    v.every(n => typeof n === 'number' && Number.isFinite(n));
}

export function isValidPosition(x: number, y: number, z: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z);
}

export function clampPosition(pos: Vector3, min: number = -1000, max: number = 1000): Vector3 {
  return pos.map(v => Math.max(min, Math.min(max, v))) as Vector3;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// ============================================
// Trading System Types
// ============================================

export const TRADE_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'expired'] as const;
export type TradeStatus = typeof TRADE_STATUSES[number];

export const TRADE_ITEM_TYPES = ['coins', 'skin', 'collectible'] as const;
export type TradeItemType = typeof TRADE_ITEM_TYPES[number];

export interface TradeItem {
  type: TradeItemType;
  itemId: string;
  amount: number;
  name: string;
  rarity?: SkinRarity;
}

export interface Trade {
  id: string;
  initiatorId: string;
  initiatorUsername: string;
  receiverId: string;
  receiverUsername: string;
  initiatorItems: TradeItem[];
  receiverItems: TradeItem[];
  initiatorConfirmed: boolean;
  receiverConfirmed: boolean;
  status: TradeStatus;
  createdAt: number;
  expiresAt: number;
}

export interface TradeRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

// ============================================
// Guild/Clan System Types
// ============================================

export const GUILD_ROLES = ['leader', 'officer', 'member'] as const;
export type GuildRole = typeof GUILD_ROLES[number];

export const GUILD_PERMISSIONS = {
  leader: ['kick', 'promote', 'demote', 'invite', 'edit', 'treasury', 'disband'],
  officer: ['kick', 'invite'],
  member: [],
} as const;

export interface Guild {
  id: string;
  name: string;
  tag: string; // 3-5 character tag like [ABC]
  description: string;
  ownerId: string;
  ownerUsername: string;
  level: number;
  experience: number;
  treasury: number;
  memberCount: number;
  maxMembers: number;
  iconColor: string;
  createdAt: number;
}

export interface GuildMember {
  id: string;
  guildId: string;
  userId: string;
  username: string;
  role: GuildRole;
  contribution: number;
  joinedAt: number;
}

export interface GuildInvite {
  id: string;
  guildId: string;
  guildName: string;
  guildTag: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface GuildChatMessage {
  id: string;
  guildId: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

// ============================================
// Achievement System Types
// ============================================

export const ACHIEVEMENT_CATEGORIES = ['explorer', 'collector', 'social', 'racer', 'style', 'special'] as const;
export type AchievementCategory = typeof ACHIEVEMENT_CATEGORIES[number];

export const ACHIEVEMENT_TIERS = ['bronze', 'silver', 'gold', 'platinum'] as const;
export type AchievementTier = typeof ACHIEVEMENT_TIERS[number];

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  requirement: number;
  points: number;
  rewardType?: 'coins' | 'skin' | 'title';
  rewardId?: string;
  rewardAmount?: number;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  progress: number;
  completed: boolean;
  completedAt?: number;
  claimed: boolean;
}

export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  percentage: number;
}

// Achievement tracking events
export type AchievementEvent =
  | { type: 'coins_collected'; amount: number }
  | { type: 'distance_walked'; meters: number }
  | { type: 'distance_driven'; meters: number }
  | { type: 'tricks_performed'; count: number }
  | { type: 'race_won'; raceId: string }
  | { type: 'treasure_found'; count: number }
  | { type: 'friend_added'; friendId: string }
  | { type: 'guild_joined'; guildId: string }
  | { type: 'skin_purchased'; skinId: string }
  | { type: 'emote_used'; emoteId: string }
  | { type: 'npc_talked'; npcId: string };

// ============================================
// Shop & Skins System Types
// ============================================

export const SKIN_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type SkinRarity = typeof SKIN_RARITIES[number];

export const SKIN_CATEGORIES = ['character', 'color', 'accessory', 'bundle'] as const;
export type SkinCategory = typeof SKIN_CATEGORIES[number];

export const CURRENCY_TYPES = ['coins', 'gems'] as const;
export type CurrencyType = typeof CURRENCY_TYPES[number];

export interface Skin {
  id: string;
  name: string;
  description: string;
  category: SkinCategory;
  rarity: SkinRarity;
  price: number;
  currency: CurrencyType;
  icon?: string; // Emoji icon for display
  // Character appearance changes
  characterType?: AnimalType;
  skinColor?: string;
  shirtColor?: string;
  pantsColor?: string;
  accessory?: AccessoryType;
  // Availability
  isAvailable: boolean;
  isLimitedTime: boolean;
  availableUntil?: number;
  requiresAchievement?: string;
  createdAt: number;
}

export interface UserSkin {
  userId: string;
  skinId: string;
  purchasedAt: number;
  equippedAt?: number;
}

export interface ShopBundle {
  id: string;
  name: string;
  description: string;
  skinIds: string[];
  originalPrice: number;
  bundlePrice: number;
  currency: CurrencyType;
  isAvailable: boolean;
  availableUntil?: number;
}

export interface UserInventory {
  userId: string;
  coins: number;
  gems: number;
  ownedSkins: string[];
  equippedSkinId?: string;
}

// ============================================
// Rarity Colors & Config
// ============================================

export const RARITY_COLORS: Record<SkinRarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export const RARITY_PRICES: Record<SkinRarity, number> = {
  common: 100,
  uncommon: 250,
  rare: 500,
  epic: 1000,
  legendary: 2500,
};

export const ACHIEVEMENT_TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
};

// ============================================
// General Inventory System Types
// ============================================

export type ItemType = 'resource' | 'tool' | 'furniture' | 'clothing';

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  count: number;
  icon: string; // Emoji or asset path
  description?: string;
  stackable: boolean;
  maxStack?: number;
}
