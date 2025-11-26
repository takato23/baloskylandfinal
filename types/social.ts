/**
 * Social Sharing Type Definitions
 * Type exports for social sharing utilities
 */

import type { SavedPhoto, PhotoFilter, FrameStyle } from './photo-mode';

// Re-export from photo-mode for convenience
export type { SavedPhoto, PhotoFilter, FrameStyle };

// Screenshot Capture Types
export interface CaptureOptions {
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9' | 'original';
  includeUI?: boolean;
  applyFilters?: boolean;
}

export interface DownloadOptions {
  filename?: string;
  filter?: PhotoFilter;
  timestamp?: number;
}

// Instagram Types
export interface InstagramStoryOptions {
  caption?: string;
  hashtags?: string[];
  stickers?: Array<{
    type: 'mention' | 'hashtag' | 'location' | 'poll' | 'emoji';
    content: string;
    position?: { x: number; y: number };
  }>;
}

// Social Platform Types
export type SocialPlatform = 'instagram' | 'twitter' | 'discord' | 'facebook';

export interface ShareOptions {
  platform: SocialPlatform;
  caption?: string;
  hashtags?: string[];
  url?: string;
}

// Player Stats Types
export interface PlayerStats {
  fishCaught: number;
  streak: number;
  photosTaken: number;
  daysPlayed: number;
}

// Hashtag Generation Types
export interface HashtagContext {
  filter?: PhotoFilter;
  timeOfDay?: 'morning' | 'day' | 'evening' | 'night';
  weather?: 'sunny' | 'rain' | 'snow';
  event?: string;
  pose?: string;
  activity?: 'fishing' | 'bug_catching' | 'exploring';
}

// Achievement Types
export interface SocialAchievement {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  icon: string;
  requirement: number;
  category: 'photos' | 'shares' | 'likes' | 'challenges';
  reward: {
    type: 'coins' | 'filter' | 'sticker' | 'pose' | 'frame';
    itemId?: string;
    amount?: number;
  };
}

// SharePanel Props
export interface SharePanelProps {
  photo: SavedPhoto;
  imageDataUrl: string;
  onClose: () => void;
  onSave?: (photo: SavedPhoto) => void;
}

// Canvas Processing Types
export interface CanvasProcessingOptions {
  sourceWidth: number;
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  cropX?: number;
  cropY?: number;
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
}

// Social Analytics Types
export interface SocialAnalytics {
  totalPhotos: number;
  totalShares: number;
  totalLikes: number;
  averageLikesPerPhoto: number;
  mostUsedFilter: PhotoFilter;
  mostUsedFrame: FrameStyle;
  sharesByPlatform: Record<SocialPlatform, number>;
  engagementRate: number;
}

// Share Result Types
export interface ShareResult {
  success: boolean;
  platform: SocialPlatform;
  error?: string;
  timestamp: number;
  photoId: string;
}

// Gallery Types
export interface GalleryFilter {
  filter?: PhotoFilter[];
  frame?: FrameStyle[];
  weather?: ('sunny' | 'rain' | 'snow')[];
  timeOfDay?: ('morning' | 'day' | 'evening' | 'night')[];
  shared?: boolean;
  minLikes?: number;
}

export interface GallerySort {
  field: 'takenAt' | 'likes' | 'filter' | 'weather';
  direction: 'asc' | 'desc';
}

// Watermark Types
export interface WatermarkOptions {
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  fontSize: number;
  color: string;
  opacity: number;
}

// Image Processing Types
export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Social Media Limits
export const SOCIAL_LIMITS = {
  instagram: {
    caption: 2200,
    hashtags: 30,
    imageSize: 8 * 1024 * 1024, // 8MB
    storySize: 4 * 1024 * 1024, // 4MB
  },
  twitter: {
    text: 280,
    imageSize: 5 * 1024 * 1024, // 5MB
    images: 4,
  },
  discord: {
    fileSize: 8 * 1024 * 1024, // 8MB (free)
    fileSizeNitro: 500 * 1024 * 1024, // 500MB (nitro)
  },
  facebook: {
    caption: 63206,
    imageSize: 4 * 1024 * 1024, // 4MB
  },
} as const;

// Utility Types
export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9' | 'original';
export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type ShareStatus = 'idle' | 'preparing' | 'sharing' | 'success' | 'error';

// Event Types
export interface ShareEvent {
  type: 'share_initiated' | 'share_completed' | 'share_failed';
  platform: SocialPlatform;
  photoId: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface CaptureEvent {
  type: 'capture_started' | 'capture_completed' | 'capture_failed';
  photoId?: string;
  timestamp: number;
  error?: string;
}
