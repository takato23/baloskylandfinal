/**
 * Online Indicator Component
 * Shows number of players currently online
 */

import React, { memo } from 'react';
import { useOnlineCountV2 } from '../../hooks/useMultiplayerV2';
import { isSupabaseConfigured } from '../../lib/supabase';

interface OnlineIndicatorProps {
  onClick?: () => void;
  className?: string;
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = memo(({ onClick, className = '' }) => {
  const onlineCount = useOnlineCountV2();
  const isConfigured = isSupabaseConfigured();

  if (!isConfigured) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm hover:bg-gray-700/80 transition-colors ${className}`}
      >
        <div className="w-2 h-2 rounded-full bg-yellow-500" />
        <span>Offline</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm hover:bg-gray-700/80 transition-colors ${className}`}
    >
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span>{onlineCount > 0 ? `${onlineCount} online` : 'Conectando...'}</span>
    </button>
  );
});

OnlineIndicator.displayName = 'OnlineIndicator';

export default OnlineIndicator;
