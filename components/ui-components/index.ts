/**
 * UI Components exports
 * Note: Customization, GeminiLiveManager, and ShareModal are lazy-loaded in UI.tsx
 * and should not be exported here to enable proper code splitting
 */
export { ChatWindow } from './ChatWindow';
export { ChatHistory } from './ChatHistory';
export { MobileControls } from './MobileControls';
export { Minimap } from './Minimap';
export { SocialChat } from './SocialChat';
export { GameChat } from './GameChat';
export { DebugPanel } from './DebugPanel';
export { Leaderboard } from './Leaderboard';
export { EventBanner } from './EventBanner';
export { PhotoModeUI } from './PhotoModeUI';

// New feature panels - lazy-loaded in UI.tsx for code splitting
// export { default as TradingPanel } from './TradingPanel';
// export { default as GuildPanel } from './GuildPanel';
// export { default as AchievementsPanel } from './AchievementsPanel';
// export { default as ShopPanel } from './ShopPanel';

// These are lazy-loaded in UI.tsx - export separately if needed elsewhere
// export { Customization } from './Customization';
// export { GeminiLiveManager } from './GeminiLiveManager';
// export { ShareModal } from './ShareModal';
// export { SharePanel } from './SharePanel'; // Lazy-loaded with photo mode
