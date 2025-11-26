/**
 * Social Sharing Utilities
 * Instagram-optimized screenshot capture, sharing, and achievement tracking
 */

import type { SavedPhoto, PhotoFilter, FrameStyle } from '../types/photo-mode';

// ============================================
// Screenshot Capture
// ============================================

export interface CaptureOptions {
  quality?: number; // 0.1-1.0, default 0.95
  format?: 'png' | 'jpeg' | 'webp';
  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9' | 'original';
  includeUI?: boolean;
  applyFilters?: boolean;
}

/**
 * Captures the current game canvas as a screenshot
 * Uses native Canvas API for maximum compatibility
 */
export async function captureScreenshot(
  canvasElement?: HTMLCanvasElement,
  options: CaptureOptions = {}
): Promise<string> {
  const {
    quality = 0.95,
    format = 'png',
    aspectRatio = 'original',
    includeUI = false,
  } = options;

  // Find the game canvas if not provided
  const canvas = canvasElement || document.querySelector('canvas');
  if (!canvas) {
    throw new Error('No canvas element found');
  }

  // Create a temporary canvas for processing
  const tempCanvas = document.createElement('canvas');
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  // Calculate dimensions based on aspect ratio
  const { width, height } = calculateAspectRatioDimensions(
    canvas.width,
    canvas.height,
    aspectRatio
  );

  tempCanvas.width = width;
  tempCanvas.height = height;

  // Calculate crop position to center the image
  const sourceX = (canvas.width - width) / 2;
  const sourceY = (canvas.height - height) / 2;

  // Draw the canvas content
  ctx.drawImage(
    canvas,
    sourceX,
    sourceY,
    width,
    height,
    0,
    0,
    width,
    height
  );

  // Convert to data URL
  const mimeType = `image/${format}`;
  const dataUrl = tempCanvas.toDataURL(mimeType, quality);

  return dataUrl;
}

/**
 * Calculate dimensions for Instagram-optimized aspect ratios
 */
function calculateAspectRatioDimensions(
  originalWidth: number,
  originalHeight: number,
  aspectRatio: '1:1' | '4:5' | '9:16' | '16:9' | 'original'
): { width: number; height: number } {
  if (aspectRatio === 'original') {
    return { width: originalWidth, height: originalHeight };
  }

  const ratios: Record<string, number> = {
    '1:1': 1,
    '4:5': 4 / 5,
    '9:16': 9 / 16,
    '16:9': 16 / 9,
  };

  const targetRatio = ratios[aspectRatio];
  const currentRatio = originalWidth / originalHeight;

  let width: number;
  let height: number;

  if (currentRatio > targetRatio) {
    // Original is wider, crop width
    height = originalHeight;
    width = height * targetRatio;
  } else {
    // Original is taller, crop height
    width = originalWidth;
    height = width / targetRatio;
  }

  return { width, height };
}

// ============================================
// Image Download
// ============================================

export interface DownloadOptions {
  filename?: string;
  filter?: PhotoFilter;
  timestamp?: number;
}

/**
 * Downloads the captured screenshot with proper naming
 * Format: cozy-city-[date]-[filter].png
 */
export function downloadImage(
  dataUrl: string,
  options: DownloadOptions = {}
): void {
  const { filter = 'none', timestamp = Date.now() } = options;

  // Generate filename
  const date = new Date(timestamp);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  const filterStr = filter !== 'none' ? `-${filter}` : '';
  const filename = options.filename || `cozy-city-${dateStr}-${timeStr}${filterStr}.png`;

  // Create download link
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================
// Instagram Stories Preparation
// ============================================

export interface InstagramStoryOptions {
  caption?: string;
  hashtags?: string[];
  stickers?: Array<{
    type: 'mention' | 'hashtag' | 'location' | 'poll' | 'emoji';
    content: string;
    position?: { x: number; y: number };
  }>;
}

/**
 * Prepares image for Instagram Stories (9:16 aspect ratio)
 * Adds padding/background if needed to match Instagram dimensions
 */
export async function prepareForInstagramStory(
  dataUrl: string,
  options: InstagramStoryOptions = {}
): Promise<string> {
  const img = await loadImage(dataUrl);

  // Instagram Stories optimal dimensions: 1080x1920
  const targetWidth = 1080;
  const targetHeight = 1920;
  const targetRatio = targetWidth / targetHeight;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Fill with gradient background (cozy aesthetic)
  const gradient = ctx.createLinearGradient(0, 0, 0, targetHeight);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Calculate image position (centered with letterboxing if needed)
  const imgRatio = img.width / img.height;
  let drawWidth: number;
  let drawHeight: number;
  let drawX: number;
  let drawY: number;

  if (imgRatio > targetRatio) {
    // Image is wider, fit to width
    drawWidth = targetWidth;
    drawHeight = targetWidth / imgRatio;
    drawX = 0;
    drawY = (targetHeight - drawHeight) / 2;
  } else {
    // Image is taller, fit to height
    drawHeight = targetHeight;
    drawWidth = targetHeight * imgRatio;
    drawX = (targetWidth - drawWidth) / 2;
    drawY = 0;
  }

  // Draw the image
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

  // Add branding watermark (bottom right)
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.textAlign = 'right';
  ctx.fillText('Cozy City Explorer', targetWidth - 30, targetHeight - 30);

  return canvas.toDataURL('image/jpeg', 0.95);
}

// ============================================
// Social Platform Sharing
// ============================================

export interface ShareOptions {
  platform: 'instagram' | 'twitter' | 'discord' | 'facebook';
  caption?: string;
  hashtags?: string[];
  url?: string;
}

/**
 * Opens native share dialog or platform-specific sharing
 */
export async function shareToSocial(
  dataUrl: string,
  options: ShareOptions
): Promise<boolean> {
  const { platform, caption = '', hashtags = [], url } = options;

  try {
    // For Instagram Stories, use prepared image
    if (platform === 'instagram') {
      const storyImage = await prepareForInstagramStory(dataUrl, {
        caption,
        hashtags,
      });

      // Check if Web Share API is available (mobile)
      if (navigator.share && isMobile()) {
        const blob = await dataUrlToBlob(storyImage);
        const file = new File([blob], 'cozy-city-photo.jpg', { type: 'image/jpeg' });

        await navigator.share({
          title: 'Cozy City Explorer',
          text: formatCaption(caption, hashtags),
          files: [file],
        });
        return true;
      }

      // Fallback: Download and show instructions
      downloadImage(storyImage, {
        filename: 'cozy-city-instagram-story.jpg',
      });
      alert(
        'Image downloaded!\n\n' +
        'To share on Instagram:\n' +
        '1. Open Instagram\n' +
        '2. Tap + → Story\n' +
        '3. Select the downloaded image\n' +
        '4. Add your caption and hashtags'
      );
      return true;
    }

    // Twitter/X sharing
    if (platform === 'twitter') {
      const text = formatCaption(caption, hashtags);
      const twitterUrl = new URL('https://twitter.com/intent/tweet');
      twitterUrl.searchParams.set('text', text);
      if (url) twitterUrl.searchParams.set('url', url);

      window.open(twitterUrl.toString(), '_blank', 'width=600,height=400');

      // Also download image for manual upload
      downloadImage(dataUrl, {
        filename: 'cozy-city-twitter.png',
      });
      return true;
    }

    // Discord sharing (download + copy caption)
    if (platform === 'discord') {
      downloadImage(dataUrl, {
        filename: 'cozy-city-discord.png',
      });

      const discordCaption = formatCaption(caption, hashtags);
      await copyToClipboard(discordCaption);

      alert(
        'Image downloaded and caption copied!\n\n' +
        'To share on Discord:\n' +
        '1. Open Discord\n' +
        '2. Upload the downloaded image\n' +
        '3. Paste the caption (Ctrl/Cmd+V)'
      );
      return true;
    }

    // Facebook sharing
    if (platform === 'facebook') {
      const facebookUrl = new URL('https://www.facebook.com/sharer/sharer.php');
      if (url) facebookUrl.searchParams.set('u', url);
      facebookUrl.searchParams.set('quote', formatCaption(caption, hashtags));

      window.open(facebookUrl.toString(), '_blank', 'width=600,height=400');

      downloadImage(dataUrl, {
        filename: 'cozy-city-facebook.png',
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to share:', error);
    return false;
  }
}

// ============================================
// Clipboard Operations
// ============================================

/**
 * Copies image to clipboard (Chrome/Edge only)
 */
export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    // Check if Clipboard API is available
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error('Clipboard API not supported');
    }

    const blob = await dataUrlToBlob(dataUrl);
    const item = new ClipboardItem({ [blob.type]: blob });
    await navigator.clipboard.write([item]);

    return true;
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error);
    return false;
  }
}

/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);

    return success;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// ============================================
// Shareable Links
// ============================================

export interface PlayerStats {
  fishCaught: number;
  streak: number;
  photosTaken: number;
  daysPlayed: number;
}

/**
 * Generates a shareable link with embedded player stats
 */
export function generateShareableLink(
  photo: SavedPhoto,
  stats: PlayerStats
): string {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    photo: photo.id,
    filter: photo.filter,
    frame: photo.frame,
    fish: stats.fishCaught.toString(),
    streak: stats.streak.toString(),
    photos: stats.photosTaken.toString(),
    days: stats.daysPlayed.toString(),
  });

  return `${baseUrl}/share?${params.toString()}`;
}

/**
 * Generates social meta tags for better sharing
 */
export function generateMetaTags(photo: SavedPhoto, stats: PlayerStats): string {
  return `
    <meta property="og:title" content="My Cozy City Adventure" />
    <meta property="og:description" content="${photo.caption || 'Check out my photo from Cozy City Explorer!'}" />
    <meta property="og:image" content="${photo.fullImage}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="My Cozy City Adventure" />
    <meta name="twitter:description" content="${photo.caption || 'Check out my photo!'}" />
    <meta name="twitter:image" content="${photo.fullImage}" />
  `;
}

// ============================================
// Social Achievement Tracking
// ============================================

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

export const SOCIAL_ACHIEVEMENTS: SocialAchievement[] = [
  {
    id: 'first_photo',
    name: 'Photographer',
    nameEs: 'Fotógrafo',
    description: 'Take your first photo',
    descriptionEs: 'Toma tu primera foto',
    icon: '📸',
    requirement: 1,
    category: 'photos',
    reward: { type: 'coins', amount: 100 },
  },
  {
    id: 'shutterbug',
    name: 'Shutterbug',
    nameEs: 'Aficionado',
    description: 'Take 10 photos',
    descriptionEs: 'Toma 10 fotos',
    icon: '📷',
    requirement: 10,
    category: 'photos',
    reward: { type: 'filter', itemId: 'vintage' },
  },
  {
    id: 'influencer',
    name: 'Influencer',
    nameEs: 'Influencer',
    description: 'Take 50 photos',
    descriptionEs: 'Toma 50 fotos',
    icon: '🌟',
    requirement: 50,
    category: 'photos',
    reward: { type: 'frame', itemId: 'polaroid' },
  },
  {
    id: 'first_share',
    name: 'Social Butterfly',
    nameEs: 'Mariposa Social',
    description: 'Share your first photo',
    descriptionEs: 'Comparte tu primera foto',
    icon: '🦋',
    requirement: 1,
    category: 'shares',
    reward: { type: 'sticker', itemId: 'sparkles' },
  },
  {
    id: 'viral',
    name: 'Going Viral',
    nameEs: 'Viral',
    description: 'Share 10 photos',
    descriptionEs: 'Comparte 10 fotos',
    icon: '🚀',
    requirement: 10,
    category: 'shares',
    reward: { type: 'pose', itemId: 'confident' },
  },
  {
    id: 'liked',
    name: 'Popular',
    nameEs: 'Popular',
    description: 'Get 100 likes',
    descriptionEs: 'Obtén 100 likes',
    icon: '❤️',
    requirement: 100,
    category: 'likes',
    reward: { type: 'filter', itemId: 'dreamy' },
  },
  {
    id: 'challenge_master',
    name: 'Challenge Master',
    nameEs: 'Maestro de Desafíos',
    description: 'Complete 5 photo challenges',
    descriptionEs: 'Completa 5 desafíos fotográficos',
    icon: '🏆',
    requirement: 5,
    category: 'challenges',
    reward: { type: 'frame', itemId: 'instagram' },
  },
];

/**
 * Simulates like reception for achievement tracking
 * In a real implementation, this would connect to a backend
 */
export function simulateLikes(photo: SavedPhoto): number {
  // Simple simulation based on photo quality factors
  const baseScore = 10;
  const filterBonus = photo.filter !== 'none' ? 5 : 0;
  const frameBonus = photo.frame !== 'none' ? 5 : 0;
  const captionBonus = photo.caption.length > 0 ? 10 : 0;
  const randomBonus = Math.floor(Math.random() * 20);

  return baseScore + filterBonus + frameBonus + captionBonus + randomBonus;
}

// ============================================
// Hashtag Generation
// ============================================

export interface HashtagContext {
  filter?: PhotoFilter;
  timeOfDay?: 'morning' | 'day' | 'evening' | 'night';
  weather?: 'sunny' | 'rain' | 'snow';
  event?: string;
  pose?: string;
  activity?: 'fishing' | 'bug_catching' | 'exploring';
}

/**
 * Generates relevant hashtags based on photo context
 */
export function generateHashtags(context: HashtagContext): string[] {
  const tags: string[] = ['#CozyCityExplorer', '#CozyCity'];

  // Filter-based tags
  if (context.filter) {
    const filterTags: Record<PhotoFilter, string[]> = {
      none: [],
      vintage: ['#Vintage', '#RetroVibes'],
      warm: ['#WarmTones', '#GoldenHour'],
      cool: ['#CoolVibes', '#Chill'],
      dramatic: ['#Dramatic', '#Moody'],
      soft: ['#SoftAesthetic', '#Dreamy'],
      film: ['#FilmPhotography', '#Analog'],
      noir: ['#Noir', '#BlackAndWhite'],
      pop: ['#PopArt', '#Vibrant'],
      pastel: ['#Pastel', '#SoftColors'],
      sunset: ['#Sunset', '#GoldenHour'],
      night: ['#NightVibes', '#Nocturnal'],
      retro: ['#Retro', '#Throwback'],
      dreamy: ['#Dreamy', '#Fantasy'],
      vibrant: ['#Vibrant', '#ColorPop'],
      muted: ['#Muted', '#Minimal'],
      sepia: ['#Sepia', '#Vintage'],
      fade: ['#Faded', '#Aesthetic'],
    };
    tags.push(...filterTags[context.filter]);
  }

  // Time of day tags
  if (context.timeOfDay === 'morning') tags.push('#MorningVibes', '#Sunrise');
  if (context.timeOfDay === 'evening') tags.push('#GoldenHour', '#Sunset');
  if (context.timeOfDay === 'night') tags.push('#NightPhotography', '#Nighttime');

  // Weather tags
  if (context.weather === 'rain') tags.push('#RainyDay', '#Moody');
  if (context.weather === 'snow') tags.push('#WinterWonderland', '#Snowy');
  if (context.weather === 'sunny') tags.push('#SunnyDay', '#Beautiful');

  // Activity tags
  if (context.activity === 'fishing') tags.push('#Fishing', '#AnimalCrossing');
  if (context.activity === 'bug_catching') tags.push('#BugCatching', '#Nature');
  if (context.activity === 'exploring') tags.push('#Exploring', '#Adventure');

  // Event tags
  if (context.event) {
    const eventTags: Record<string, string[]> = {
      christmas: ['#Christmas', '#HolidayVibes'],
      halloween: ['#Halloween', '#Spooky'],
      new_year: ['#NewYear', '#Celebration'],
      spring: ['#Spring', '#CherryBlossoms'],
    };
    if (context.event in eventTags) {
      tags.push(...eventTags[context.event]);
    }
  }

  // General gaming tags
  tags.push('#IndieGame', '#Gaming', '#VirtualPhotography');

  // Limit to 10 most relevant tags
  return tags.slice(0, 10);
}

// ============================================
// Utility Functions
// ============================================

function formatCaption(caption: string, hashtags: string[]): string {
  const hashtagStr = hashtags.join(' ');
  return caption ? `${caption}\n\n${hashtagStr}` : hashtagStr;
}

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
