/**
 * Instagram Story Templates
 * Pre-designed overlay templates for social sharing
 * Optimized for 150k+ follower Instagram audiences
 */

export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  gradient: string;
  textColor: string;
  accentColor: string;
  fontStyle: 'modern' | 'playful' | 'elegant' | 'bold';
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: 'neon',
    name: 'Neon City',
    description: 'Vibrante estilo cyberpunk',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    textColor: '#ffffff',
    accentColor: '#00ffff',
    fontStyle: 'modern',
  },
  {
    id: 'sunset',
    name: 'Golden Hour',
    description: 'Cálido atardecer dorado',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 50%, #f093fb 100%)',
    textColor: '#2d1b69',
    accentColor: '#ff6b6b',
    fontStyle: 'elegant',
  },
  {
    id: 'cozy',
    name: 'Cozy Vibes',
    description: 'Suave y acogedor',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ee9ca7 100%)',
    textColor: '#5c4033',
    accentColor: '#e74c3c',
    fontStyle: 'playful',
  },
  {
    id: 'night',
    name: 'Night Mode',
    description: 'Oscuro y misterioso',
    gradient: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
    textColor: '#ffffff',
    accentColor: '#e94560',
    fontStyle: 'bold',
  },
  {
    id: 'fresh',
    name: 'Fresh Start',
    description: 'Limpio y minimalista',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #d299c2 100%)',
    textColor: '#2c3e50',
    accentColor: '#1abc9c',
    fontStyle: 'modern',
  },
  {
    id: 'gaming',
    name: 'Gamer Mode',
    description: 'Estilo gaming RGB',
    gradient: 'linear-gradient(135deg, #4776E6 0%, #8E54E9 50%, #00d4ff 100%)',
    textColor: '#ffffff',
    accentColor: '#00ff88',
    fontStyle: 'bold',
  },
];

export interface GameStats {
  coins: number;
  characterType: string;
  characterName?: string;
  trickCombo?: number;
  isNight?: boolean;
  weather?: string;
  location?: string;
  playTime?: string;
}

/**
 * Applies a story template overlay to the canvas
 */
export const applyStoryTemplate = (
  ctx: CanvasRenderingContext2D,
  template: StoryTemplate,
  stats: GameStats,
  width: number,
  height: number
) => {
  // Top gradient overlay
  const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.25);
  topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
  topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = topGradient;
  ctx.fillRect(0, 0, width, height * 0.25);

  // Bottom gradient overlay
  const bottomGradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
  bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
  ctx.fillStyle = bottomGradient;
  ctx.fillRect(0, height * 0.7, width, height * 0.3);

  // Font sizing based on canvas width
  const titleSize = Math.floor(width * 0.06);
  const subtitleSize = Math.floor(width * 0.035);
  const statsSize = Math.floor(width * 0.04);
  const smallSize = Math.floor(width * 0.028);

  // Set up text rendering
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Apply shadow for all text
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  const padding = width * 0.05;

  // Top section - Game title and branding
  ctx.fillStyle = template.textColor;
  ctx.font = `bold ${titleSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillText('COZY CITY', padding, padding);

  ctx.font = `${subtitleSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = template.accentColor;
  ctx.fillText('EXPLORER', padding, padding + titleSize);

  // Stats badges (top right)
  const badgeY = padding;
  const badgeX = width - padding;
  ctx.textAlign = 'right';

  // Coins badge
  if (stats.coins > 0) {
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${statsSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(`🪙 ${stats.coins}`, badgeX, badgeY);
  }

  // Combo badge
  if (stats.trickCombo && stats.trickCombo > 1) {
    ctx.fillStyle = '#FF6B6B';
    ctx.font = `bold ${statsSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(`🔥 x${stats.trickCombo}`, badgeX, badgeY + statsSize + 8);
  }

  // Bottom section - Character info and call to action
  const bottomY = height - padding - smallSize * 6;
  ctx.textAlign = 'left';

  // Character type with emoji
  const characterEmojis: Record<string, string> = {
    bear: '🐻', cat: '🐱', rabbit: '🐰', fox: '🦊', dog: '🐕',
    panda: '🐼', koala: '🐨', lion: '🦁', pig: '🐷', chicken: '🐔',
    elephant: '🐘', sheep: '🐑', penguin: '🐧', duck: '🦆', zebra: '🦓',
    mouse: '🐭', cow: '🐮', frog: '🐸', monkey: '🐵', tiger: '🐯',
    raccoon: '🦝', deer: '🦌', hedgehog: '🦔', beaver: '🦫', platypus: '🦆',
  };

  const emoji = characterEmojis[stats.characterType] || '🎮';
  ctx.fillStyle = template.textColor;
  ctx.font = `bold ${statsSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(`${emoji} ${stats.characterName || stats.characterType}`, padding, bottomY);

  // Environment info
  if (stats.isNight || stats.weather) {
    ctx.font = `${smallSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const envText = [
      stats.isNight ? '🌙 Noche' : '☀️ Día',
      stats.weather ? getWeatherEmoji(stats.weather) : '',
    ].filter(Boolean).join(' • ');
    ctx.fillText(envText, padding, bottomY + statsSize + 8);
  }

  // Call to action
  ctx.fillStyle = template.accentColor;
  ctx.font = `bold ${smallSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillText('¡Juega gratis! Link en bio 👆', padding, height - padding - smallSize);

  // Game watermark (bottom right)
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = `${smallSize * 0.8}px system-ui, -apple-system, sans-serif`;
  ctx.fillText('@cozycityexplorer', badgeX, height - padding - smallSize * 0.8);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

/**
 * Draws a decorative frame around the screenshot
 */
export const applyDecorativeFrame = (
  ctx: CanvasRenderingContext2D,
  template: StoryTemplate,
  width: number,
  height: number
) => {
  const frameWidth = Math.floor(width * 0.015);

  // Create gradient border
  const gradient = ctx.createLinearGradient(0, 0, width, height);

  // Parse gradient colors from template
  gradient.addColorStop(0, template.accentColor);
  gradient.addColorStop(0.5, template.textColor);
  gradient.addColorStop(1, template.accentColor);

  ctx.strokeStyle = gradient;
  ctx.lineWidth = frameWidth;

  // Rounded rectangle frame
  const radius = width * 0.02;
  ctx.beginPath();
  ctx.roundRect(
    frameWidth / 2,
    frameWidth / 2,
    width - frameWidth,
    height - frameWidth,
    radius
  );
  ctx.stroke();
};

/**
 * Creates a "swipe up" animation hint (static version)
 */
export const addSwipeUpHint = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const centerX = width / 2;
  const bottomY = height * 0.92;
  const arrowSize = width * 0.04;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.textAlign = 'center';

  // Arrow pointing up
  ctx.beginPath();
  ctx.moveTo(centerX, bottomY - arrowSize);
  ctx.lineTo(centerX - arrowSize * 0.6, bottomY);
  ctx.lineTo(centerX + arrowSize * 0.6, bottomY);
  ctx.closePath();
  ctx.fill();

  // "Swipe up" text
  ctx.font = `bold ${width * 0.025}px system-ui, -apple-system, sans-serif`;
  ctx.fillText('Desliza para jugar', centerX, bottomY + arrowSize * 0.5);
};

function getWeatherEmoji(weather: string): string {
  const emojis: Record<string, string> = {
    sunny: '☀️ Soleado',
    cloudy: '☁️ Nublado',
    rainy: '🌧️ Lluvia',
    snowy: '❄️ Nieve',
    foggy: '🌫️ Niebla',
  };
  return emojis[weather] || '';
}

/**
 * Generates hashtags based on game state
 */
export const generateHashtags = (stats: GameStats): string[] => {
  const base = ['#CozyCityExplorer', '#Gaming', '#IndieGame', '#CuteGames'];

  const conditional: string[] = [];

  if (stats.trickCombo && stats.trickCombo > 3) {
    conditional.push('#SkateGames', '#TrickShot');
  }

  if (stats.isNight) {
    conditional.push('#NightMode', '#Aesthetic');
  }

  if (stats.characterType) {
    conditional.push(`#${stats.characterType.charAt(0).toUpperCase() + stats.characterType.slice(1)}`);
  }

  return [...base, ...conditional].slice(0, 10);
};

/**
 * Generates a shareable caption
 */
export const generateCaption = (stats: GameStats, template: StoryTemplate): string => {
  const characterEmojis: Record<string, string> = {
    bear: '🐻', cat: '🐱', rabbit: '🐰', fox: '🦊', dog: '🐕',
    panda: '🐼', koala: '🐨', lion: '🦁', pig: '🐷', chicken: '🐔',
  };

  const emoji = characterEmojis[stats.characterType] || '🎮';
  const hashtags = generateHashtags(stats);

  const captions = [
    `${emoji} Explorando la ciudad con mi ${stats.characterType}! ${stats.coins > 0 ? `Ya tengo ${stats.coins} monedas 🪙` : ''}\n\n${hashtags.join(' ')}`,
    `Tarde perfecta en Cozy City ✨ ${stats.isNight ? '🌙 Modo nocturno activado!' : '☀️'}\n\n¿Ya lo probaste? Link en bio 👆\n\n${hashtags.join(' ')}`,
    `${stats.trickCombo && stats.trickCombo > 1 ? `🔥 Combo x${stats.trickCombo}! ` : ''}Mi personaje favorito paseando 💕\n\n${hashtags.join(' ')}`,
  ];

  return captions[Math.floor(Math.random() * captions.length)];
};
