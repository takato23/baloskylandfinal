/**
 * QuickShareButton Component
 * Floating action button for quick screenshot capture during epic moments
 * Auto-appears during trick combos and special events
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useGameStore } from '../../store';
import { downloadScreenshot, shareScreenshot } from '../../utils/screenshot';
import { playSound } from '../../utils/audio';

interface QuickShareButtonProps {
  onOpenFullShare: () => void;
}

export const QuickShareButton: React.FC<QuickShareButtonProps> = memo(({ onOpenFullShare }) => {
  const trickCombo = useGameStore((s) => s.trickCombo);
  const isDriving = useGameStore((s) => s.isDriving);
  const coins = useGameStore((s) => s.coins);
  const currentTrick = useGameStore((s) => s.currentTrick);

  const [isVisible, setIsVisible] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

  // Show button during epic moments
  useEffect(() => {
    const shouldShow =
      (isDriving && trickCombo >= 2) || // Combo de 2+ trucos
      (currentTrick && currentTrick !== null) || // Durante un truco
      coins > 0 && coins % 10 === 0; // Cada 10 monedas

    if (shouldShow && !isVisible) {
      setIsVisible(true);
      playSound('coin');

      // Auto-hide after 8 seconds of inactivity
      if (autoHideTimer) clearTimeout(autoHideTimer);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 8000);
      setAutoHideTimer(timer);
    }

    return () => {
      if (autoHideTimer) clearTimeout(autoHideTimer);
    };
  }, [trickCombo, isDriving, currentTrick, coins]);

  // Quick capture handler
  const handleQuickCapture = useCallback(async () => {
    if (isCapturing) return;

    setIsCapturing(true);
    playSound('trick_success');

    try {
      // Try native share first (mobile)
      if ('share' in navigator && navigator.canShare) {
        await shareScreenshot(
          { format: 'story', filter: 'none', watermark: true },
          {
            title: 'Cozy City Explorer',
            text: trickCombo > 1
              ? `🔥 Combo x${trickCombo}! Mira este truco en Cozy City Explorer! #Gaming #IndieGame`
              : '🏙️ Explorando Cozy City! #CozyCityExplorer #Gaming',
          }
        );
      } else {
        // Fallback to download
        await downloadScreenshot({ format: 'story', filter: 'none', watermark: true });
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('Quick capture failed:', err);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, trickCombo]);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-32 right-4 z-40 flex flex-col items-end gap-2 pointer-events-auto animate-in slide-in-from-right duration-300">
      {/* Epic moment indicator */}
      {trickCombo >= 2 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
          🔥 ¡Momento épico!
        </div>
      )}

      {/* Main quick share button */}
      <button
        onClick={handleQuickCapture}
        disabled={isCapturing}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 ${
          showSuccess
            ? 'bg-green-500'
            : 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400'
        } ${isCapturing ? 'animate-pulse' : ''}`}
      >
        {isCapturing ? (
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
        ) : showSuccess ? (
          <span className="text-white text-2xl">✓</span>
        ) : (
          <span className="text-white text-2xl">📸</span>
        )}
      </button>

      {/* Expand to full share modal */}
      <button
        onClick={() => {
          setIsVisible(false);
          onOpenFullShare();
        }}
        className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-full text-xs font-medium shadow-md hover:bg-white transition-colors"
      >
        Más opciones →
      </button>
    </div>
  );
});

QuickShareButton.displayName = 'QuickShareButton';
