/**
 * EmoteSystem Component
 * Complete emote system integration for multiplayer
 * Combines EmoteWheel UI with multiplayer broadcasting
 */

import React, { useCallback } from 'react';
import { useMultiplayerV2 } from '../../hooks/useMultiplayerV2';
import { EmoteWheel } from './EmoteWheel';
import { useIsMobile } from '../../hooks/useIsMobile';

// ============================================
// Emote System Component
// ============================================

export const EmoteSystem: React.FC = () => {
  const { doEmote, isConnected } = useMultiplayerV2();
  const isMobile = useIsMobile();

  // Handle emote selection from wheel
  const handleEmote = useCallback((emoji: string, action: string) => {
    if (!isConnected) {
      console.warn('Not connected to multiplayer. Emote not sent.');
      return;
    }

    // Special actions
    if (action === 'chat') {
      // Open chat window (to be implemented in game UI)
      console.log('Open chat triggered');
    } else if (action === 'photo') {
      // Trigger screenshot (to be implemented)
      console.log('Screenshot triggered');
    }

    // Send emote to multiplayer
    doEmote(emoji, action);
  }, [doEmote, isConnected]);

  // Only show if connected to multiplayer
  if (!isConnected) {
    return null;
  }

  return (
    <EmoteWheel
      onEmote={handleEmote}
      isMobile={isMobile}
    />
  );
};

export default EmoteSystem;
