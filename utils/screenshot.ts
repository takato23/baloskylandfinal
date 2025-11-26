/**
 * Screenshot Capture Utility
 * Captures the Three.js canvas and provides Instagram-optimized exports
 */

// Instagram Story dimensions (9:16 aspect ratio)
export const INSTAGRAM_STORY = { width: 1080, height: 1920 };
// Instagram Post dimensions (1:1 aspect ratio)
export const INSTAGRAM_POST = { width: 1080, height: 1080 };
// Instagram Landscape (1.91:1 aspect ratio)
export const INSTAGRAM_LANDSCAPE = { width: 1080, height: 566 };

export interface ScreenshotOptions {
  format: 'story' | 'post' | 'landscape' | 'original';
  filter?: 'none' | 'vintage' | 'warm' | 'cool' | 'dramatic' | 'sunset';
  watermark?: boolean;
  quality?: number;
}

export interface ScreenshotResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Gets the Three.js canvas element
 */
export const getGameCanvas = (): HTMLCanvasElement | null => {
  return document.querySelector('canvas');
};

/**
 * Applies color filter to canvas context
 */
const applyFilter = (
  ctx: CanvasRenderingContext2D,
  filter: ScreenshotOptions['filter'],
  width: number,
  height: number
) => {
  if (!filter || filter === 'none') return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    switch (filter) {
      case 'vintage':
        // Sepia-like warm tones with reduced saturation
        data[i] = Math.min(255, r * 1.1 + 30);
        data[i + 1] = Math.min(255, g * 0.9 + 20);
        data[i + 2] = Math.min(255, b * 0.8);
        break;

      case 'warm':
        // Warm golden tones
        data[i] = Math.min(255, r * 1.15);
        data[i + 1] = Math.min(255, g * 1.05);
        data[i + 2] = Math.min(255, b * 0.9);
        break;

      case 'cool':
        // Cool blue tones
        data[i] = Math.min(255, r * 0.9);
        data[i + 1] = Math.min(255, g * 1.0);
        data[i + 2] = Math.min(255, b * 1.15);
        break;

      case 'dramatic':
        // High contrast, slightly desaturated
        const avg = (r + g + b) / 3;
        const contrast = 1.3;
        data[i] = Math.min(255, Math.max(0, (r - 128) * contrast + 128 + (avg - r) * 0.2));
        data[i + 1] = Math.min(255, Math.max(0, (g - 128) * contrast + 128 + (avg - g) * 0.2));
        data[i + 2] = Math.min(255, Math.max(0, (b - 128) * contrast + 128 + (avg - b) * 0.2));
        break;

      case 'sunset':
        // Orange/pink sunset vibes
        data[i] = Math.min(255, r * 1.2 + 20);
        data[i + 1] = Math.min(255, g * 0.95);
        data[i + 2] = Math.min(255, b * 0.85 + 30);
        break;
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

/**
 * Adds watermark/branding overlay - @Balosky branding
 */
const addWatermark = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gameName: string = 'Cozy City Explorer'
) => {
  // Semi-transparent gradient at bottom
  const gradient = ctx.createLinearGradient(0, height - 140, 0, height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - 140, width, 140);

  // Add shadow for better visibility
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Game name text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.font = `bold ${Math.floor(width * 0.038)}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(gameName, width * 0.04, height - 55);

  // @Balosky credit - Instagram handle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = `${Math.floor(width * 0.028)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText('🇦🇷 by @Balosky', width * 0.04, height - 25);

  // Argentina flag emoji on the right
  ctx.textAlign = 'right';
  ctx.font = `bold ${Math.floor(width * 0.025)}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('🎮 Hecho en Argentina', width * 0.96, height - 25);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

/**
 * Adds character stats overlay
 */
export const addStatsOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stats: {
    coins?: number;
    characterType?: string;
    trickCombo?: number;
    location?: string;
  }
) => {
  const padding = width * 0.04;
  const fontSize = Math.floor(width * 0.028);

  // Top left stats box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(padding, padding, width * 0.35, height * 0.08, 12);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  let y = padding + height * 0.04;

  if (stats.coins !== undefined) {
    ctx.fillText(`🪙 ${stats.coins} monedas`, padding + 12, y);
  }

  if (stats.trickCombo && stats.trickCombo > 1) {
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`🔥 Combo x${stats.trickCombo}!`, padding + width * 0.18, y);
  }
};

/**
 * Captures a screenshot with Instagram-optimized dimensions and effects
 */
export const captureScreenshot = async (
  options: ScreenshotOptions = { format: 'story', watermark: true }
): Promise<ScreenshotResult | null> => {
  const canvas = getGameCanvas();
  if (!canvas) {
    console.error('No canvas found');
    return null;
  }

  // Determine target dimensions
  let targetWidth: number;
  let targetHeight: number;

  switch (options.format) {
    case 'story':
      targetWidth = INSTAGRAM_STORY.width;
      targetHeight = INSTAGRAM_STORY.height;
      break;
    case 'post':
      targetWidth = INSTAGRAM_POST.width;
      targetHeight = INSTAGRAM_POST.height;
      break;
    case 'landscape':
      targetWidth = INSTAGRAM_LANDSCAPE.width;
      targetHeight = INSTAGRAM_LANDSCAPE.height;
      break;
    case 'original':
    default:
      targetWidth = canvas.width;
      targetHeight = canvas.height;
      break;
  }

  // Create output canvas
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;
  const ctx = outputCanvas.getContext('2d');

  if (!ctx) {
    console.error('Could not get 2D context');
    return null;
  }

  // Calculate crop/scale to fit target aspect ratio (cover mode)
  const sourceAspect = canvas.width / canvas.height;
  const targetAspect = targetWidth / targetHeight;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = canvas.width;
  let sourceHeight = canvas.height;

  if (sourceAspect > targetAspect) {
    // Source is wider - crop sides
    sourceWidth = canvas.height * targetAspect;
    sourceX = (canvas.width - sourceWidth) / 2;
  } else {
    // Source is taller - crop top/bottom
    sourceHeight = canvas.width / targetAspect;
    sourceY = (canvas.height - sourceHeight) / 2;
  }

  // Fill background (in case of any gaps)
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Draw the game canvas
  ctx.drawImage(
    canvas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );

  // Apply filter
  if (options.filter && options.filter !== 'none') {
    applyFilter(ctx, options.filter, targetWidth, targetHeight);
  }

  // Add watermark if requested
  if (options.watermark !== false) {
    addWatermark(ctx, targetWidth, targetHeight);
  }

  // Convert to blob
  const quality = options.quality || 0.92;

  return new Promise((resolve) => {
    outputCanvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        resolve({
          dataUrl: outputCanvas.toDataURL('image/jpeg', quality),
          blob,
          width: targetWidth,
          height: targetHeight,
        });
      },
      'image/jpeg',
      quality
    );
  });
};

/**
 * Downloads the screenshot
 */
export const downloadScreenshot = async (
  options: ScreenshotOptions = { format: 'story', watermark: true }
): Promise<boolean> => {
  const result = await captureScreenshot(options);
  if (!result) return false;

  const link = document.createElement('a');
  link.href = result.dataUrl;

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  link.download = `cozy-city-${options.format}-${timestamp}.jpg`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return true;
};

/**
 * Copies screenshot to clipboard (for easy pasting)
 */
export const copyScreenshotToClipboard = async (
  options: ScreenshotOptions = { format: 'post', watermark: true }
): Promise<boolean> => {
  const result = await captureScreenshot(options);
  if (!result) return false;

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': result.blob,
      }),
    ]);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};

/**
 * Share via native Web Share API (mobile-friendly)
 */
export const shareScreenshot = async (
  options: ScreenshotOptions = { format: 'story', watermark: true },
  shareData?: { title?: string; text?: string }
): Promise<boolean> => {
  const result = await captureScreenshot(options);
  if (!result) return false;

  // Check if Web Share API is available
  if (!navigator.share || !navigator.canShare) {
    // Fallback to download
    return downloadScreenshot(options);
  }

  const file = new File([result.blob], 'cozy-city-screenshot.jpg', {
    type: 'image/jpeg',
  });

  const data: ShareData = {
    title: shareData?.title || 'Cozy City Explorer',
    text: shareData?.text || 'Mira mi aventura en Cozy City Explorer! 🏙️✨',
    files: [file],
  };

  // Check if files can be shared
  if (!navigator.canShare(data)) {
    // Fallback without files
    delete data.files;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('Share failed:', err);
    }
    return false;
  }
};
