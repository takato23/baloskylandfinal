/**
 * LocalPlayerEmotes Component
 * Renders emote bubbles above the local player's head
 */

import React, { useCallback } from 'react';
import { useMultiplayerV2 } from '../../hooks/useMultiplayerV2';
import { EmoteBubbleQueue } from './EmoteBubble';

// ============================================
// Local Player Emotes Component
// ============================================

export const LocalPlayerEmotes: React.FC = () => {
  const { localEmotes, removeEmote } = useMultiplayerV2();

  // Handle emote completion
  const handleEmoteComplete = useCallback((emoteId: string) => {
    removeEmote(emoteId, true);
  }, [removeEmote]);

  if (!localEmotes || localEmotes.length === 0) {
    return null;
  }

  return (
    <EmoteBubbleQueue
      emotes={localEmotes}
      onEmoteComplete={handleEmoteComplete}
    />
  );
};

export default LocalPlayerEmotes;
