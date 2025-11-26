/**
 * Photo Mode System
 * Instagram-optimized photo capture with filters, poses, and sharing
 */

import { Vector3 } from './game';

// ============================================
// Camera Controls
// ============================================

export interface PhotoCameraState {
  isActive: boolean;
  position: Vector3;
  target: Vector3;
  fov: number; // 30-90
  zoom: number; // 0.5-3
  rotation: number; // Y-axis rotation
  tilt: number; // X-axis tilt
  roll: number; // Z-axis roll (dutch angle)
}

// ============================================
// Filters & Effects
// ============================================

export const PHOTO_FILTERS = [
  'none', 'vintage', 'warm', 'cool', 'dramatic', 'soft',
  'film', 'noir', 'pop', 'pastel', 'sunset', 'night',
  'retro', 'dreamy', 'vibrant', 'muted', 'sepia', 'fade'
] as const;
export type PhotoFilter = typeof PHOTO_FILTERS[number];

export interface FilterSettings {
  name: PhotoFilter;
  displayName: string;
  displayNameEs: string;
  brightness: number; // -100 to 100
  contrast: number;
  saturation: number;
  hue: number;
  vignette: number; // 0-100
  grain: number; // 0-100
  blur: number; // 0-20
  temperature: number; // -100 to 100 (cool to warm)
}

export const FILTER_PRESETS: FilterSettings[] = [
  { name: 'none', displayName: 'Original', displayNameEs: 'Original', brightness: 0, contrast: 0, saturation: 0, hue: 0, vignette: 0, grain: 0, blur: 0, temperature: 0 },
  { name: 'vintage', displayName: 'Vintage', displayNameEs: 'Vintage', brightness: 5, contrast: 10, saturation: -20, hue: 0, vignette: 30, grain: 20, blur: 0, temperature: 20 },
  { name: 'warm', displayName: 'Warm', displayNameEs: 'Cálido', brightness: 10, contrast: 5, saturation: 10, hue: 0, vignette: 0, grain: 0, blur: 0, temperature: 40 },
  { name: 'cool', displayName: 'Cool', displayNameEs: 'Frío', brightness: 0, contrast: 10, saturation: -10, hue: 0, vignette: 0, grain: 0, blur: 0, temperature: -40 },
  { name: 'dramatic', displayName: 'Dramatic', displayNameEs: 'Dramático', brightness: -10, contrast: 40, saturation: 10, hue: 0, vignette: 50, grain: 10, blur: 0, temperature: 0 },
  { name: 'soft', displayName: 'Soft', displayNameEs: 'Suave', brightness: 15, contrast: -15, saturation: -10, hue: 0, vignette: 20, grain: 0, blur: 3, temperature: 10 },
  { name: 'film', displayName: 'Film', displayNameEs: 'Película', brightness: 5, contrast: 15, saturation: -15, hue: 0, vignette: 25, grain: 35, blur: 0, temperature: 10 },
  { name: 'noir', displayName: 'Noir', displayNameEs: 'Noir', brightness: 0, contrast: 30, saturation: -100, hue: 0, vignette: 40, grain: 15, blur: 0, temperature: 0 },
  { name: 'pop', displayName: 'Pop', displayNameEs: 'Pop', brightness: 10, contrast: 20, saturation: 40, hue: 0, vignette: 0, grain: 0, blur: 0, temperature: 0 },
  { name: 'pastel', displayName: 'Pastel', displayNameEs: 'Pastel', brightness: 20, contrast: -20, saturation: -30, hue: 0, vignette: 10, grain: 0, blur: 2, temperature: 15 },
  { name: 'sunset', displayName: 'Sunset', displayNameEs: 'Atardecer', brightness: 10, contrast: 10, saturation: 20, hue: -10, vignette: 30, grain: 0, blur: 0, temperature: 50 },
  { name: 'night', displayName: 'Night', displayNameEs: 'Noche', brightness: -20, contrast: 20, saturation: -20, hue: 10, vignette: 40, grain: 20, blur: 0, temperature: -30 },
  { name: 'retro', displayName: 'Retro', displayNameEs: 'Retro', brightness: 10, contrast: 5, saturation: -25, hue: 15, vignette: 35, grain: 40, blur: 1, temperature: 25 },
  { name: 'dreamy', displayName: 'Dreamy', displayNameEs: 'Soñador', brightness: 20, contrast: -10, saturation: 10, hue: 0, vignette: 20, grain: 0, blur: 5, temperature: 20 },
  { name: 'vibrant', displayName: 'Vibrant', displayNameEs: 'Vibrante', brightness: 5, contrast: 25, saturation: 50, hue: 0, vignette: 0, grain: 0, blur: 0, temperature: 5 },
  { name: 'muted', displayName: 'Muted', displayNameEs: 'Apagado', brightness: 0, contrast: -10, saturation: -40, hue: 0, vignette: 15, grain: 5, blur: 0, temperature: -5 },
  { name: 'sepia', displayName: 'Sepia', displayNameEs: 'Sepia', brightness: 10, contrast: 10, saturation: -60, hue: 30, vignette: 25, grain: 15, blur: 0, temperature: 40 },
  { name: 'fade', displayName: 'Fade', displayNameEs: 'Desvanecido', brightness: 15, contrast: -20, saturation: -30, hue: 0, vignette: 0, grain: 10, blur: 0, temperature: 0 },
];

// ============================================
// Character Poses
// ============================================

export const POSE_CATEGORIES = ['casual', 'action', 'cute', 'cool', 'funny', 'seasonal'] as const;
export type PoseCategory = typeof POSE_CATEGORIES[number];

export interface CharacterPose {
  id: string;
  name: string;
  nameEs: string;
  icon: string;
  category: PoseCategory;
  animationName: string;
  duration: number; // Seconds, 0 = static
  isUnlocked: boolean;
  unlockMethod?: 'default' | 'achievement' | 'event' | 'shop';
  unlockId?: string;
}

export const CHARACTER_POSES: CharacterPose[] = [
  // Casual
  { id: 'stand', name: 'Standing', nameEs: 'De Pie', icon: '🧍', category: 'casual', animationName: 'idle', duration: 0, isUnlocked: true },
  { id: 'sit', name: 'Sitting', nameEs: 'Sentado', icon: '🪑', category: 'casual', animationName: 'sit', duration: 0, isUnlocked: true },
  { id: 'wave', name: 'Waving', nameEs: 'Saludando', icon: '👋', category: 'casual', animationName: 'wave', duration: 2, isUnlocked: true },
  { id: 'think', name: 'Thinking', nameEs: 'Pensando', icon: '🤔', category: 'casual', animationName: 'think', duration: 0, isUnlocked: true },
  { id: 'lean', name: 'Leaning', nameEs: 'Apoyado', icon: '😎', category: 'casual', animationName: 'lean', duration: 0, isUnlocked: true },

  // Action
  { id: 'jump', name: 'Jumping', nameEs: 'Saltando', icon: '⬆️', category: 'action', animationName: 'jump', duration: 1, isUnlocked: true },
  { id: 'run', name: 'Running', nameEs: 'Corriendo', icon: '🏃', category: 'action', animationName: 'run', duration: 0, isUnlocked: true },
  { id: 'fish', name: 'Fishing', nameEs: 'Pescando', icon: '🎣', category: 'action', animationName: 'fish', duration: 0, isUnlocked: true },
  { id: 'catch_net', name: 'Net Swing', nameEs: 'Atrapar', icon: '🥅', category: 'action', animationName: 'net_swing', duration: 1, isUnlocked: true },
  { id: 'dig', name: 'Digging', nameEs: 'Cavando', icon: '⛏️', category: 'action', animationName: 'dig', duration: 2, isUnlocked: true },

  // Cute
  { id: 'peace', name: 'Peace Sign', nameEs: 'Paz y Amor', icon: '✌️', category: 'cute', animationName: 'peace', duration: 0, isUnlocked: true },
  { id: 'heart', name: 'Heart Pose', nameEs: 'Corazón', icon: '💕', category: 'cute', animationName: 'heart', duration: 2, isUnlocked: true },
  { id: 'shy', name: 'Shy', nameEs: 'Tímido', icon: '🙈', category: 'cute', animationName: 'shy', duration: 0, isUnlocked: true },
  { id: 'excited', name: 'Excited', nameEs: 'Emocionado', icon: '🤩', category: 'cute', animationName: 'excited', duration: 2, isUnlocked: true },
  { id: 'sleepy', name: 'Sleepy', nameEs: 'Dormilón', icon: '😴', category: 'cute', animationName: 'sleepy', duration: 0, isUnlocked: true },

  // Cool
  { id: 'confident', name: 'Confident', nameEs: 'Confiado', icon: '😏', category: 'cool', animationName: 'confident', duration: 0, isUnlocked: true },
  { id: 'crossed_arms', name: 'Crossed Arms', nameEs: 'Brazos Cruzados', icon: '💪', category: 'cool', animationName: 'crossed_arms', duration: 0, isUnlocked: true },
  { id: 'sunglasses', name: 'Cool Shades', nameEs: 'Gafas Cool', icon: '😎', category: 'cool', animationName: 'sunglasses', duration: 0, isUnlocked: true, unlockMethod: 'shop' },
  { id: 'point', name: 'Pointing', nameEs: 'Señalando', icon: '👉', category: 'cool', animationName: 'point', duration: 1, isUnlocked: true },

  // Funny
  { id: 'dance', name: 'Dancing', nameEs: 'Bailando', icon: '💃', category: 'funny', animationName: 'dance', duration: 4, isUnlocked: true },
  { id: 'dab', name: 'Dab', nameEs: 'Dab', icon: '🙅', category: 'funny', animationName: 'dab', duration: 1, isUnlocked: true },
  { id: 'sneeze', name: 'Sneeze', nameEs: 'Estornudo', icon: '🤧', category: 'funny', animationName: 'sneeze', duration: 1, isUnlocked: true },
  { id: 'facepalm', name: 'Facepalm', nameEs: 'Facepalm', icon: '🤦', category: 'funny', animationName: 'facepalm', duration: 1, isUnlocked: true },
  { id: 'shrug', name: 'Shrug', nameEs: 'Encogerse', icon: '🤷', category: 'funny', animationName: 'shrug', duration: 1, isUnlocked: true },

  // Seasonal (unlockable)
  { id: 'snowball', name: 'Snowball', nameEs: 'Bola de Nieve', icon: '⛄', category: 'seasonal', animationName: 'snowball', duration: 2, isUnlocked: false, unlockMethod: 'event', unlockId: 'christmas' },
  { id: 'firework', name: 'Firework', nameEs: 'Fuegos Artificiales', icon: '🎆', category: 'seasonal', animationName: 'firework', duration: 3, isUnlocked: false, unlockMethod: 'event', unlockId: 'new_year' },
  { id: 'spooky', name: 'Spooky', nameEs: 'Escalofriante', icon: '👻', category: 'seasonal', animationName: 'spooky', duration: 2, isUnlocked: false, unlockMethod: 'event', unlockId: 'halloween' },
  { id: 'mate_sip', name: 'Mate Sip', nameEs: 'Tomando Mate', icon: '🧉', category: 'seasonal', animationName: 'mate_sip', duration: 3, isUnlocked: false, unlockMethod: 'achievement', unlockId: 'argentino' },
];

// ============================================
// Photo Frame & Stickers
// ============================================

export const FRAME_STYLES = [
  'none', 'polaroid', 'vintage', 'modern', 'cute', 'elegant',
  'seasonal', 'film_strip', 'comic', 'magazine', 'instagram'
] as const;
export type FrameStyle = typeof FRAME_STYLES[number];

export interface PhotoFrame {
  id: FrameStyle;
  name: string;
  nameEs: string;
  borderWidth: number;
  borderColor: string;
  padding: number;
  cornerRadius: number;
  hasDate: boolean;
  hasCaption: boolean;
  aspectRatio: '1:1' | '4:5' | '16:9' | '9:16' | 'free';
}

export const PHOTO_FRAMES: PhotoFrame[] = [
  { id: 'none', name: 'No Frame', nameEs: 'Sin Marco', borderWidth: 0, borderColor: 'transparent', padding: 0, cornerRadius: 0, hasDate: false, hasCaption: false, aspectRatio: 'free' },
  { id: 'polaroid', name: 'Polaroid', nameEs: 'Polaroid', borderWidth: 20, borderColor: '#fff', padding: 60, cornerRadius: 0, hasDate: true, hasCaption: true, aspectRatio: '1:1' },
  { id: 'vintage', name: 'Vintage', nameEs: 'Vintage', borderWidth: 15, borderColor: '#f5e6d3', padding: 30, cornerRadius: 0, hasDate: true, hasCaption: false, aspectRatio: 'free' },
  { id: 'modern', name: 'Modern', nameEs: 'Moderno', borderWidth: 5, borderColor: '#000', padding: 10, cornerRadius: 0, hasDate: false, hasCaption: false, aspectRatio: '16:9' },
  { id: 'cute', name: 'Cute', nameEs: 'Kawaii', borderWidth: 10, borderColor: '#ffb6c1', padding: 20, cornerRadius: 20, hasDate: false, hasCaption: true, aspectRatio: '1:1' },
  { id: 'elegant', name: 'Elegant', nameEs: 'Elegante', borderWidth: 3, borderColor: '#d4af37', padding: 15, cornerRadius: 0, hasDate: false, hasCaption: false, aspectRatio: '4:5' },
  { id: 'instagram', name: 'Instagram', nameEs: 'Instagram', borderWidth: 0, borderColor: 'transparent', padding: 0, cornerRadius: 0, hasDate: false, hasCaption: false, aspectRatio: '1:1' },
];

export interface PhotoSticker {
  id: string;
  name: string;
  nameEs: string;
  icon: string;
  category: 'emoji' | 'seasonal' | 'cute' | 'text' | 'decoration';
  isAnimated: boolean;
  isUnlocked: boolean;
}

export const PHOTO_STICKERS: PhotoSticker[] = [
  // Emoji
  { id: 'heart_eyes', name: 'Heart Eyes', nameEs: 'Ojos de Corazón', icon: '😍', category: 'emoji', isAnimated: false, isUnlocked: true },
  { id: 'fire', name: 'Fire', nameEs: 'Fuego', icon: '🔥', category: 'emoji', isAnimated: true, isUnlocked: true },
  { id: 'sparkles', name: 'Sparkles', nameEs: 'Brillos', icon: '✨', category: 'emoji', isAnimated: true, isUnlocked: true },
  { id: 'star', name: 'Star', nameEs: 'Estrella', icon: '⭐', category: 'emoji', isAnimated: false, isUnlocked: true },
  { id: 'rainbow', name: 'Rainbow', nameEs: 'Arcoíris', icon: '🌈', category: 'emoji', isAnimated: false, isUnlocked: true },

  // Cute
  { id: 'hearts_floating', name: 'Floating Hearts', nameEs: 'Corazones Flotantes', icon: '💕', category: 'cute', isAnimated: true, isUnlocked: true },
  { id: 'flower_crown', name: 'Flower Crown', nameEs: 'Corona de Flores', icon: '👑🌸', category: 'cute', isAnimated: false, isUnlocked: true },
  { id: 'bunny_ears', name: 'Bunny Ears', nameEs: 'Orejas de Conejo', icon: '🐰', category: 'cute', isAnimated: false, isUnlocked: true },
  { id: 'cat_ears', name: 'Cat Ears', nameEs: 'Orejas de Gato', icon: '🐱', category: 'cute', isAnimated: false, isUnlocked: true },

  // Seasonal
  { id: 'snowflakes', name: 'Snowflakes', nameEs: 'Copos de Nieve', icon: '❄️', category: 'seasonal', isAnimated: true, isUnlocked: true },
  { id: 'cherry_blossoms', name: 'Cherry Blossoms', nameEs: 'Flores de Cerezo', icon: '🌸', category: 'seasonal', isAnimated: true, isUnlocked: true },
  { id: 'autumn_leaves', name: 'Autumn Leaves', nameEs: 'Hojas de Otoño', icon: '🍂', category: 'seasonal', isAnimated: true, isUnlocked: true },
  { id: 'fireworks', name: 'Fireworks', nameEs: 'Fuegos Artificiales', icon: '🎆', category: 'seasonal', isAnimated: true, isUnlocked: true },

  // Text
  { id: 'gm', name: 'Good Morning', nameEs: 'Buenos Días', icon: '☀️', category: 'text', isAnimated: false, isUnlocked: true },
  { id: 'gn', name: 'Good Night', nameEs: 'Buenas Noches', icon: '🌙', category: 'text', isAnimated: false, isUnlocked: true },
  { id: 'mood', name: 'Mood', nameEs: 'Mood', icon: '💅', category: 'text', isAnimated: false, isUnlocked: true },
  { id: 'vibes', name: 'Vibes', nameEs: 'Vibras', icon: '🎵', category: 'text', isAnimated: false, isUnlocked: true },

  // Decoration
  { id: 'light_leak', name: 'Light Leak', nameEs: 'Fuga de Luz', icon: '☀️', category: 'decoration', isAnimated: false, isUnlocked: true },
  { id: 'film_grain', name: 'Film Grain', nameEs: 'Grano de Película', icon: '📽️', category: 'decoration', isAnimated: false, isUnlocked: true },
  { id: 'bokeh', name: 'Bokeh Lights', nameEs: 'Luces Bokeh', icon: '💡', category: 'decoration', isAnimated: true, isUnlocked: true },
  { id: 'confetti', name: 'Confetti', nameEs: 'Confeti', icon: '🎊', category: 'decoration', isAnimated: true, isUnlocked: true },
];

// ============================================
// Photo State
// ============================================

export interface PhotoModeState {
  isActive: boolean;
  camera: PhotoCameraState;
  filter: PhotoFilter;
  customFilter: FilterSettings | null;
  pose: string;
  frame: FrameStyle;
  stickers: Array<{
    stickerId: string;
    position: { x: number; y: number };
    scale: number;
    rotation: number;
  }>;
  caption: string;
  showUI: boolean;
  hideCharacter: boolean;
  depthOfField: boolean;
  dofFocusDistance: number;
  dofAperture: number;
}

// ============================================
// Photo Gallery
// ============================================

export interface SavedPhoto {
  id: string;
  takenAt: number;
  location: string;
  locationEs: string;
  filter: PhotoFilter;
  frame: FrameStyle;
  pose: string;
  caption: string;
  thumbnail: string; // Base64 or URL
  fullImage: string;
  likes: number;
  shared: boolean;
  sharedTo?: ('instagram' | 'twitter' | 'discord')[];
  weather: 'sunny' | 'rain' | 'snow';
  timeOfDay: 'morning' | 'day' | 'evening' | 'night';
  event?: string; // Seasonal event ID if taken during event
  withFriends?: string[]; // Friend IDs in photo
}

export interface PhotoGallery {
  photos: SavedPhoto[];
  favorites: string[];
  albums: Array<{
    id: string;
    name: string;
    photoIds: string[];
    coverPhotoId?: string;
    createdAt: number;
  }>;
  totalPhotos: number;
  totalLikes: number;
  totalShares: number;
}

// ============================================
// Photo Challenges (Instagram Engagement)
// ============================================

export interface PhotoChallenge {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  icon: string;
  theme: string;
  requirements: {
    filter?: PhotoFilter[];
    pose?: string[];
    frame?: FrameStyle[];
    timeOfDay?: ('morning' | 'day' | 'evening' | 'night')[];
    weather?: ('sunny' | 'rain' | 'snow')[];
    location?: string[];
    withFriends?: boolean;
    duringEvent?: string;
  };
  reward: {
    type: 'coins' | 'sticker' | 'filter' | 'pose' | 'frame';
    itemId?: string;
    amount?: number;
  };
  startsAt: number;
  endsAt: number;
  hashtag: string;
}

export const WEEKLY_PHOTO_CHALLENGES: PhotoChallenge[] = [
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    nameEs: 'Hora Dorada',
    description: 'Take a photo during sunset',
    descriptionEs: 'Toma una foto durante el atardecer',
    icon: '🌅',
    theme: 'Sunset shots',
    requirements: { timeOfDay: ['evening'] },
    reward: { type: 'coins', amount: 500 },
    startsAt: 0,
    endsAt: 0,
    hashtag: '#CozyCityGoldenHour',
  },
  {
    id: 'rainy_mood',
    name: 'Rainy Mood',
    nameEs: 'Día Lluvioso',
    description: 'Capture the rain',
    descriptionEs: 'Captura la lluvia',
    icon: '🌧️',
    theme: 'Rainy day vibes',
    requirements: { weather: ['rain'] },
    reward: { type: 'sticker', itemId: 'rain_drops' },
    startsAt: 0,
    endsAt: 0,
    hashtag: '#CozyCityRain',
  },
  {
    id: 'squad_goals',
    name: 'Squad Goals',
    nameEs: 'Meta de Amigos',
    description: 'Photo with 3+ friends',
    descriptionEs: 'Foto con 3+ amigos',
    icon: '👯',
    theme: 'Friendship',
    requirements: { withFriends: true },
    reward: { type: 'pose', itemId: 'group_hug' },
    startsAt: 0,
    endsAt: 0,
    hashtag: '#CozyCitySquad',
  },
  {
    id: 'vintage_vibes',
    name: 'Vintage Vibes',
    nameEs: 'Vibras Vintage',
    description: 'Use retro filters',
    descriptionEs: 'Usa filtros retro',
    icon: '📷',
    theme: 'Retro aesthetic',
    requirements: { filter: ['vintage', 'sepia', 'film', 'retro'] },
    reward: { type: 'filter', itemId: 'super_retro' },
    startsAt: 0,
    endsAt: 0,
    hashtag: '#CozyCityVintage',
  },
];
