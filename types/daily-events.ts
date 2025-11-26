/**
 * Daily Activities & Seasonal Events System
 * Perfect for Instagram engagement - daily content and FOMO mechanics
 */

import { Vector3 } from './game';
import type { Skin } from './game';

// ============================================
// Daily Rewards System
// ============================================

export interface DailyReward {
  day: number; // 1-7 for weekly cycle
  type: 'coins' | 'item' | 'recipe' | 'special';
  amount?: number;
  itemId?: string;
  description: string;
  descriptionEs: string;
  icon: string;
}

export interface DailyStreak {
  currentStreak: number;
  longestStreak: number;
  lastClaimDate: string; // YYYY-MM-DD
  totalDaysClaimed: number;
  weeklyProgress: boolean[]; // 7 days
}

export const WEEKLY_REWARDS: DailyReward[] = [
  { day: 1, type: 'coins', amount: 100, icon: '🪙', description: 'Daily coins', descriptionEs: 'Monedas diarias' },
  { day: 2, type: 'coins', amount: 150, icon: '🪙', description: 'Keep it up!', descriptionEs: 'Sigue asi!' },
  { day: 3, type: 'item', itemId: 'mystery_seed', icon: '🌱', description: 'Mystery seed', descriptionEs: 'Semilla misteriosa' },
  { day: 4, type: 'coins', amount: 200, icon: '🪙', description: 'Halfway there!', descriptionEs: 'A mitad de camino!' },
  { day: 5, type: 'recipe', itemId: 'random_recipe', icon: '📜', description: 'DIY Recipe', descriptionEs: 'Receta DIY' },
  { day: 6, type: 'coins', amount: 300, icon: '💰', description: 'Almost there!', descriptionEs: 'Casi llegas!' },
  { day: 7, type: 'special', itemId: 'weekly_chest', icon: '🎁', description: 'Weekly chest!', descriptionEs: 'Cofre semanal!' },
];

// ============================================
// Daily Tasks/Missions
// ============================================

export const TASK_TYPES = [
  'catch_fish', 'catch_bug', 'dig_fossil', 'plant_flower',
  'water_flowers', 'talk_npc', 'visit_friend', 'sell_items',
  'craft_item', 'donate_museum', 'take_photo', 'customize_character'
] as const;
export type TaskType = typeof TASK_TYPES[number];

export interface DailyTask {
  id: string;
  type: TaskType;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  icon: string;
  target: number;
  reward: {
    type: 'coins' | 'nook_miles' | 'item';
    amount?: number;
    itemId?: string;
  };
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TaskProgress {
  taskId: string;
  current: number;
  completed: boolean;
  claimedAt?: number;
}

export interface DailyTasksState {
  tasks: DailyTask[];
  progress: TaskProgress[];
  refreshedAt: number; // Timestamp of last refresh
  bonusComplete: boolean; // All tasks done bonus
}

// ============================================
// Nook Miles System (Secondary Currency)
// ============================================

export interface NookMilesReward {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  icon: string;
  cost: number;
  type: 'item' | 'recipe' | 'ticket' | 'cosmetic';
  itemId?: string;
  isLimitedTime?: boolean;
}

export interface NookMilesProgress {
  total: number;
  lifetime: number;
  achievements: string[]; // Completed milestone IDs
}

// ============================================
// Seasonal Events
// ============================================

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = typeof SEASONS[number];

export interface SeasonalEvent {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  icon: string;
  season: Season;
  startDate: string; // MM-DD
  endDate: string;
  specialItems: string[];
  specialNPCs?: string[];
  specialActivities: string[];
  backgroundMusic?: string;
  weatherOverride?: 'sunny' | 'rain' | 'snow' | 'cherry_blossoms' | 'fireworks';
}

// Pre-defined seasonal events (Animal Crossing inspired + Argentine flavors)
export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'new_year',
    name: 'New Year Countdown',
    nameEs: 'Cuenta Regresiva de Año Nuevo',
    description: 'Celebrate the new year with fireworks!',
    descriptionEs: 'Celebra el año nuevo con fuegos artificiales!',
    icon: '🎆',
    season: 'summer', // Southern hemisphere
    startDate: '12-31',
    endDate: '01-02',
    specialItems: ['party_popper', 'new_year_hat', 'countdown_clock'],
    specialActivities: ['fireworks_show', 'countdown_gathering'],
    weatherOverride: 'fireworks',
  },
  {
    id: 'carnival',
    name: 'Carnival Festival',
    nameEs: 'Festival de Carnaval',
    description: 'Dance and collect colorful feathers!',
    descriptionEs: 'Baila y colecciona plumas coloridas!',
    icon: '🎭',
    season: 'summer',
    startDate: '02-20',
    endDate: '02-25',
    specialItems: ['carnival_mask', 'feather_red', 'feather_blue', 'feather_gold', 'samba_outfit'],
    specialNPCs: ['pavé'],
    specialActivities: ['feather_hunt', 'dance_contest'],
  },
  {
    id: 'cherry_blossom',
    name: 'Cherry Blossom Season',
    nameEs: 'Temporada de Cerezos',
    description: 'Catch cherry blossom petals!',
    descriptionEs: 'Atrapa pétalos de cerezo!',
    icon: '🌸',
    season: 'spring',
    startDate: '09-01', // Southern hemisphere spring
    endDate: '09-10',
    specialItems: ['cherry_petal', 'blossom_lantern', 'sakura_umbrella', 'picnic_set'],
    specialActivities: ['petal_catching', 'hanami_picnic'],
    weatherOverride: 'cherry_blossoms',
  },
  {
    id: 'easter',
    name: 'Bunny Day',
    nameEs: 'Día del Conejo',
    description: 'Hunt for colorful eggs!',
    descriptionEs: 'Busca huevos coloridos!',
    icon: '🥚',
    season: 'autumn', // Southern hemisphere
    startDate: '04-01',
    endDate: '04-12',
    specialItems: ['earth_egg', 'stone_egg', 'leaf_egg', 'wood_egg', 'sky_egg', 'water_egg'],
    specialNPCs: ['zipper'],
    specialActivities: ['egg_hunt', 'egg_crafting'],
  },
  {
    id: 'friend_day',
    name: 'Friendship Day',
    nameEs: 'Día del Amigo',
    description: 'Celebrate friendship Argentine style!',
    descriptionEs: 'Celebra la amistad al estilo argentino!',
    icon: '💝',
    season: 'winter', // July 20 in Argentina
    startDate: '07-18',
    endDate: '07-22',
    specialItems: ['friendship_bracelet', 'mate_set', 'photo_frame', 'heart_balloon'],
    specialActivities: ['gift_exchange', 'group_photo', 'mate_sharing'],
  },
  {
    id: 'halloween',
    name: 'Halloween Night',
    nameEs: 'Noche de Halloween',
    description: 'Trick or treat in the city!',
    descriptionEs: 'Dulce o truco en la ciudad!',
    icon: '🎃',
    season: 'spring', // October in Southern hemisphere
    startDate: '10-25',
    endDate: '11-01',
    specialItems: ['pumpkin', 'candy', 'spooky_costume', 'jack_lantern', 'ghost_mask'],
    specialNPCs: ['jack'],
    specialActivities: ['trick_or_treat', 'pumpkin_carving', 'costume_contest'],
  },
  {
    id: 'christmas',
    name: 'Toy Day',
    nameEs: 'Día de los Juguetes',
    description: 'Help deliver gifts!',
    descriptionEs: 'Ayuda a entregar regalos!',
    icon: '🎄',
    season: 'summer', // December in Southern hemisphere
    startDate: '12-15',
    endDate: '12-26',
    specialItems: ['gift_wrap', 'ornament', 'festive_tree', 'santa_outfit', 'jingle_bell'],
    specialNPCs: ['jingle'],
    specialActivities: ['gift_delivery', 'tree_decorating', 'carol_singing'],
  },
  {
    id: 'summer_solstice',
    name: 'Summer Solstice',
    nameEs: 'Solsticio de Verano',
    description: 'Longest day celebration!',
    descriptionEs: 'Celebración del día más largo!',
    icon: '☀️',
    season: 'summer',
    startDate: '12-20',
    endDate: '12-23',
    specialItems: ['sun_crown', 'beach_towel', 'sunflower_bouquet'],
    specialActivities: ['sunrise_watching', 'beach_party'],
  },
];

// ============================================
// Special Visitors (NPC Events)
// ============================================

export interface SpecialVisitor {
  id: string;
  name: string;
  nameEs: string;
  icon: string;
  description: string;
  descriptionEs: string;
  visitDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  visitChance: number; // 0-1
  specialActivity: string;
  rewards: string[];
}

export const SPECIAL_VISITORS: SpecialVisitor[] = [
  {
    id: 'kicks',
    name: 'Kicks',
    nameEs: 'Betunio',
    icon: '👟',
    description: 'Shoe and bag merchant',
    descriptionEs: 'Vendedor de zapatos y bolsos',
    visitDays: ['monday', 'friday'],
    visitChance: 0.3,
    specialActivity: 'shoe_shopping',
    rewards: ['rare_shoes', 'designer_bag'],
  },
  {
    id: 'sahara',
    name: 'Saharah',
    nameEs: 'Alcatifa',
    icon: '🐪',
    description: 'Exotic rug dealer',
    descriptionEs: 'Vendedora de alfombras exóticas',
    visitDays: ['wednesday', 'saturday'],
    visitChance: 0.25,
    specialActivity: 'rug_shopping',
    rewards: ['mysterious_rug', 'wallpaper'],
  },
  {
    id: 'flick',
    name: 'Flick',
    nameEs: 'Kamilo',
    icon: '🦎',
    description: 'Bug enthusiast, pays 1.5x!',
    descriptionEs: 'Entusiasta de insectos, paga 1.5x!',
    visitDays: ['tuesday', 'thursday', 'sunday'],
    visitChance: 0.2,
    specialActivity: 'bug_selling',
    rewards: ['bug_model_commission'],
  },
  {
    id: 'cj',
    name: 'C.J.',
    nameEs: 'CJ',
    icon: '🎣',
    description: 'Fishing streamer, pays 1.5x!',
    descriptionEs: 'Streamer de pesca, paga 1.5x!',
    visitDays: ['wednesday', 'saturday'],
    visitChance: 0.2,
    specialActivity: 'fish_selling',
    rewards: ['fish_model_commission'],
  },
  {
    id: 'celeste',
    name: 'Celeste',
    nameEs: 'Estela',
    icon: '🦉',
    description: 'Stargazing owl with DIY recipes',
    descriptionEs: 'Búho astrónoma con recetas DIY',
    visitDays: ['friday', 'saturday'],
    visitChance: 0.15,
    specialActivity: 'stargazing',
    rewards: ['star_fragment_recipe', 'zodiac_recipe'],
  },
  {
    id: 'gulliver',
    name: 'Gulliver',
    nameEs: 'Gulliván',
    icon: '🦆',
    description: 'Lost sailor needs help!',
    descriptionEs: 'Marinero perdido necesita ayuda!',
    visitDays: ['monday', 'wednesday', 'friday'],
    visitChance: 0.1,
    specialActivity: 'find_communicator_parts',
    rewards: ['world_landmark', 'rare_furniture'],
  },
];

// ============================================
// Hourly Events
// ============================================

export interface HourlyEvent {
  hour: number; // 0-23
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  icon: string;
  effect: 'music_change' | 'npc_activity' | 'shop_discount' | 'rare_spawn';
}

export const HOURLY_EVENTS: HourlyEvent[] = [
  { hour: 5, name: 'Dawn Chorus', nameEs: 'Coro del Amanecer', description: 'Birds wake up', descriptionEs: 'Los pájaros despiertan', icon: '🐦', effect: 'music_change' },
  { hour: 8, name: 'Morning Rush', nameEs: 'Hora Pico', description: 'NPCs head to work', descriptionEs: 'NPCs van al trabajo', icon: '☕', effect: 'npc_activity' },
  { hour: 12, name: 'Lunch Break', nameEs: 'Almuerzo', description: 'Special lunch deals', descriptionEs: 'Ofertas de almuerzo', icon: '🍽️', effect: 'shop_discount' },
  { hour: 17, name: 'Golden Hour', nameEs: 'Hora Dorada', description: 'Perfect photo lighting', descriptionEs: 'Luz perfecta para fotos', icon: '🌅', effect: 'music_change' },
  { hour: 20, name: 'Night Market', nameEs: 'Mercado Nocturno', description: 'Special vendors appear', descriptionEs: 'Aparecen vendedores especiales', icon: '🏮', effect: 'rare_spawn' },
  { hour: 23, name: 'Meteor Shower', nameEs: 'Lluvia de Estrellas', description: 'Wish upon a star!', descriptionEs: 'Pide un deseo!', icon: '🌠', effect: 'rare_spawn' },
];

// ============================================
// Weather-Based Events
// ============================================

export interface WeatherEvent {
  weather: 'rain' | 'snow' | 'sunny';
  name: string;
  nameEs: string;
  bonuses: {
    fishSpawnRate?: number;
    bugSpawnRate?: number;
    flowerGrowth?: number;
    specialSpawns?: string[];
  };
}

export const WEATHER_EVENTS: WeatherEvent[] = [
  {
    weather: 'rain',
    name: 'Rainy Day',
    nameEs: 'Día Lluvioso',
    bonuses: {
      fishSpawnRate: 1.5,
      bugSpawnRate: 0.5,
      flowerGrowth: 2,
      specialSpawns: ['coelacanth', 'snail', 'frog'],
    },
  },
  {
    weather: 'snow',
    name: 'Snowy Day',
    nameEs: 'Día Nevado',
    bonuses: {
      fishSpawnRate: 0.8,
      bugSpawnRate: 0.2,
      specialSpawns: ['snowflake', 'dung_beetle'],
    },
  },
  {
    weather: 'sunny',
    name: 'Sunny Day',
    nameEs: 'Día Soleado',
    bonuses: {
      fishSpawnRate: 1,
      bugSpawnRate: 1.5,
      flowerGrowth: 1,
      specialSpawns: ['peacock_butterfly', 'agrias_butterfly'],
    },
  },
];
