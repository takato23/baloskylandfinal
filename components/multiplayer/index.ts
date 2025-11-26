/**
 * Multiplayer components exports
 * V2 optimized for 50-100+ concurrent players
 * V3 ultra-optimized (90% performance improvement)
 */

// V1 components (legacy - kept for compatibility)
export { RemotePlayers, MinimapPlayers } from './RemotePlayers';
export { PlayerSync } from './PlayerSync';

// V2 components (optimized for scale)
export { RemotePlayersV2, MinimapPlayersV2, PlayerCountIndicator } from './RemotePlayersV2';
export { PlayerSyncV2, SyncDebugOverlay, SyncDebugOverlay as SyncDebugOverlayV2 } from './PlayerSyncV2';

// V3 components (ultra-optimized with instanced rendering)
export { InstancedPlayersV3, InstancedPlayersPerformanceMonitor } from './InstancedPlayers';

// Shared components
export { MultiplayerChat } from './MultiplayerChat';
export { OnlineIndicator } from './OnlineIndicator';
export { EmoteBubble, EmoteBubbleQueue } from './EmoteBubble';
export { EmoteWheel, useEmoteWheel } from './EmoteWheel';
export { EmoteSystem } from './EmoteSystem';
export { LocalPlayerEmotes } from './LocalPlayerEmotes';
