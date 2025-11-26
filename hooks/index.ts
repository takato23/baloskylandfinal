/**
 * Custom hooks exports
 */
export { useGameInput, getRawInput, getMovementDirection } from './useGameInput';
export { useIsMobile, useOrientation, useIsStandalone } from './useIsMobile';
export { useSkateboard } from './useSkateboard';
export type { TrickType, TrickRotation, SkateboardState, SkateboardControls } from './useSkateboard';
export { useDistanceCulling, useLODLevel } from './useDistanceCulling';

// Multiplayer hooks V1 (legacy - kept for compatibility)
export {
  useMultiplayer,
  useRemotePlayers,
  useOnlineCount,
  useChatMessages,
} from './useMultiplayer';
export type { RemotePlayer, MultiplayerChatMessage } from './useMultiplayer';

// Multiplayer hooks V2 (optimized for 50-100+ players)
export {
  useMultiplayerV2,
  useRemotePlayersV2,
  useOnlineCountV2,
  useChatMessagesV2,
  useMultiplayerStats,
} from './useMultiplayerV2';
export type { RemotePlayerV2, ChatMessageV2 } from './useMultiplayerV2';

// Multiplayer hooks V3 (ultra-optimized, 90% performance improvement)
export {
  useMultiplayerV3,
  useRemotePlayersV3,
  useOnlineCountV3,
  useChatMessagesV3,
  useMultiplayerStatsV3,
} from './useMultiplayerV3';
export type { PooledPlayer, ChatMessage as ChatMessageV3, EmoteData as EmoteDataV3 } from './useMultiplayerV3';

// Events hooks
export { useEvents } from './useEvents';

// Chat hooks
export { useChatHistory } from './useChatHistory';
export type { ChatConversation } from './useChatHistory';

// Mobile gesture hooks
export {
  useMobileGestures,
  useSwipe,
  useTap,
  useEdgeSwipe,
} from './useMobileGestures';
export type {
  GestureType,
  GestureEvent,
  GestureConfig,
  SwipeDirection,
  SwipeConfig,
  TapConfig,
  EdgeSwipeConfig,
} from './useMobileGestures';

// Economy hooks
export {
  useEconomy,
  useFormattedPlayTime,
  useTrickTracker,
  useDailyReward,
} from './useEconomy';
