/**
 * Mobile Detection Hook
 * Detects if user is on a touch device
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Detect if the current device supports touch input
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  const checkMobile = useCallback(() => {
    // Check for touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    // Check for coarse pointer (touch screen)
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    // Check screen width
    const isSmallScreen = window.innerWidth <= 1024;

    setIsMobile(hasTouch && (hasCoarsePointer || isSmallScreen));
  }, []);

  useEffect(() => {
    checkMobile();

    // Listen for orientation changes and resize
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, [checkMobile]);

  return isMobile;
}

/**
 * Get current screen orientation
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  useEffect(() => {
    const checkOrientation = () => {
      if (window.innerHeight > window.innerWidth) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return orientation;
}

/**
 * Check if device is in standalone/PWA mode
 */
export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();
  }, []);

  return isStandalone;
}
