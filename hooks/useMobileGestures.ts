/**
 * Mobile Gesture Detection Hook
 * Handles swipe, tap, double-tap, and long-press gestures for mobile controls
 */

import { useCallback, useRef, useEffect } from 'react';

// ============================================
// Types
// ============================================

export type GestureType =
  | 'tap'
  | 'double-tap'
  | 'long-press'
  | 'swipe-up'
  | 'swipe-down'
  | 'swipe-left'
  | 'swipe-right'
  | 'pinch-in'
  | 'pinch-out';

export interface GestureEvent {
  type: GestureType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  velocity: number;
  duration: number;
  timestamp: number;
}

export interface GestureConfig {
  // Thresholds
  swipeThreshold?: number;      // Minimum distance for swipe (default: 50px)
  swipeVelocity?: number;       // Minimum velocity for swipe (default: 0.3 px/ms)
  tapMaxDuration?: number;      // Maximum duration for tap (default: 200ms)
  doubleTapDelay?: number;      // Maximum delay between taps (default: 300ms)
  longPressDelay?: number;      // Delay for long press (default: 500ms)

  // Callbacks
  onTap?: (event: GestureEvent) => void;
  onDoubleTap?: (event: GestureEvent) => void;
  onLongPress?: (event: GestureEvent) => void;
  onSwipeUp?: (event: GestureEvent) => void;
  onSwipeDown?: (event: GestureEvent) => void;
  onSwipeLeft?: (event: GestureEvent) => void;
  onSwipeRight?: (event: GestureEvent) => void;
  onPinchIn?: (event: GestureEvent) => void;
  onPinchOut?: (event: GestureEvent) => void;
  onAnyGesture?: (event: GestureEvent) => void;

  // Options
  preventDefault?: boolean;
  stopPropagation?: boolean;
  passive?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isActive: boolean;
  initialDistance?: number; // For pinch gestures
}

// ============================================
// Haptic Feedback Helper
// ============================================

const vibrate = (pattern: number = 10) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// ============================================
// Main Hook
// ============================================

export function useMobileGestures(
  ref: React.RefObject<HTMLElement>,
  config: GestureConfig
) {
  const {
    swipeThreshold = 50,
    swipeVelocity = 0.3,
    tapMaxDuration = 200,
    doubleTapDelay = 300,
    longPressDelay = 500,
    onTap,
    onDoubleTap,
    onLongPress,
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    onPinchIn,
    onPinchOut,
    onAnyGesture,
    preventDefault = true,
    stopPropagation = true,
    passive = false,
  } = config;

  // Refs for tracking touch state
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isActive: false,
  });

  const lastTapTime = useRef<number>(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create gesture event object
  const createGestureEvent = useCallback((
    type: GestureType,
    endX: number,
    endY: number
  ): GestureEvent => {
    const { startX, startY, startTime } = touchState.current;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const duration = Date.now() - startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / Math.max(duration, 1);

    return {
      type,
      startX,
      startY,
      endX,
      endY,
      deltaX,
      deltaY,
      velocity,
      duration,
      timestamp: Date.now(),
    };
  }, []);

  // Emit gesture event
  const emitGesture = useCallback((event: GestureEvent) => {
    onAnyGesture?.(event);

    switch (event.type) {
      case 'tap':
        vibrate(5);
        onTap?.(event);
        break;
      case 'double-tap':
        vibrate(10);
        onDoubleTap?.(event);
        break;
      case 'long-press':
        vibrate(20);
        onLongPress?.(event);
        break;
      case 'swipe-up':
        vibrate(8);
        onSwipeUp?.(event);
        break;
      case 'swipe-down':
        vibrate(8);
        onSwipeDown?.(event);
        break;
      case 'swipe-left':
        vibrate(8);
        onSwipeLeft?.(event);
        break;
      case 'swipe-right':
        vibrate(8);
        onSwipeRight?.(event);
        break;
      case 'pinch-in':
        vibrate(5);
        onPinchIn?.(event);
        break;
      case 'pinch-out':
        vibrate(5);
        onPinchOut?.(event);
        break;
    }
  }, [onTap, onDoubleTap, onLongPress, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onPinchIn, onPinchOut, onAnyGesture]);

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Calculate distance between two touches (for pinch)
  const getTouchDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Touch start handler
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault && !passive) e.preventDefault();
    if (stopPropagation) e.stopPropagation();

    const touch = e.touches[0];

    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isActive: true,
      initialDistance: e.touches.length >= 2 ? getTouchDistance(e.touches) : undefined,
    };

    // Start long press timer
    clearLongPressTimer();
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        if (touchState.current.isActive) {
          const event = createGestureEvent('long-press', touch.clientX, touch.clientY);
          emitGesture(event);
          touchState.current.isActive = false; // Prevent further gestures
        }
      }, longPressDelay);
    }
  }, [preventDefault, stopPropagation, passive, getTouchDistance, clearLongPressTimer, onLongPress, longPressDelay, createGestureEvent, emitGesture]);

  // Touch move handler
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchState.current.isActive) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Cancel long press if moved too much
    if (distance > 10) {
      clearLongPressTimer();
    }

    // Handle pinch gesture
    if (e.touches.length >= 2 && touchState.current.initialDistance) {
      const currentDistance = getTouchDistance(e.touches);
      const delta = currentDistance - touchState.current.initialDistance;

      if (Math.abs(delta) > 30) {
        const gestureType: GestureType = delta > 0 ? 'pinch-out' : 'pinch-in';
        const event = createGestureEvent(gestureType, touch.clientX, touch.clientY);
        emitGesture(event);
        touchState.current.initialDistance = currentDistance; // Reset for continuous detection
      }
    }
  }, [clearLongPressTimer, getTouchDistance, createGestureEvent, emitGesture]);

  // Touch end handler
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchState.current.isActive) return;

    clearLongPressTimer();

    const touch = e.changedTouches[0];
    const { startX, startY, startTime } = touchState.current;
    const endX = touch.clientX;
    const endY = touch.clientY;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const duration = Date.now() - startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / Math.max(duration, 1);

    touchState.current.isActive = false;

    // Determine gesture type
    if (distance >= swipeThreshold && velocity >= swipeVelocity) {
      // Swipe gesture
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      let gestureType: GestureType;
      if (absX > absY) {
        gestureType = deltaX > 0 ? 'swipe-right' : 'swipe-left';
      } else {
        gestureType = deltaY > 0 ? 'swipe-down' : 'swipe-up';
      }

      const event = createGestureEvent(gestureType, endX, endY);
      emitGesture(event);
    } else if (duration <= tapMaxDuration && distance < 30) {
      // Tap or double-tap
      const now = Date.now();

      if (now - lastTapTime.current <= doubleTapDelay && onDoubleTap) {
        // Double tap
        const event = createGestureEvent('double-tap', endX, endY);
        emitGesture(event);
        lastTapTime.current = 0; // Reset to prevent triple tap
      } else {
        // Single tap - wait for potential double tap
        lastTapTime.current = now;

        if (onTap && !onDoubleTap) {
          // No double tap handler, emit immediately
          const event = createGestureEvent('tap', endX, endY);
          emitGesture(event);
        } else if (onTap) {
          // Wait for potential double tap
          setTimeout(() => {
            if (lastTapTime.current === now) {
              const event = createGestureEvent('tap', endX, endY);
              emitGesture(event);
            }
          }, doubleTapDelay);
        }
      }
    }
  }, [clearLongPressTimer, swipeThreshold, swipeVelocity, tapMaxDuration, doubleTapDelay, onTap, onDoubleTap, createGestureEvent, emitGesture]);

  // Touch cancel handler
  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer();
    touchState.current.isActive = false;
  }, [clearLongPressTimer]);

  // Attach event listeners
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const options: AddEventListenerOptions = { passive };

    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);
    element.addEventListener('touchcancel', handleTouchCancel, options);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
      clearLongPressTimer();
    };
  }, [ref, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, clearLongPressTimer, passive]);
}

// ============================================
// Simplified Swipe Hook
// ============================================

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

export interface SwipeConfig {
  threshold?: number;
  velocity?: number;
  onSwipe: (direction: SwipeDirection) => void;
  preventDefault?: boolean;
}

export function useSwipe(
  ref: React.RefObject<HTMLElement>,
  config: SwipeConfig
) {
  const { threshold = 50, velocity = 0.3, onSwipe, preventDefault = true } = config;

  useMobileGestures(ref, {
    swipeThreshold: threshold,
    swipeVelocity: velocity,
    onSwipeUp: () => onSwipe('up'),
    onSwipeDown: () => onSwipe('down'),
    onSwipeLeft: () => onSwipe('left'),
    onSwipeRight: () => onSwipe('right'),
    preventDefault,
  });
}

// ============================================
// Simplified Tap Hook
// ============================================

export interface TapConfig {
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  doubleTapDelay?: number;
  longPressDelay?: number;
}

export function useTap(
  ref: React.RefObject<HTMLElement>,
  config: TapConfig
) {
  const { onTap, onDoubleTap, onLongPress, doubleTapDelay = 300, longPressDelay = 500 } = config;

  useMobileGestures(ref, {
    doubleTapDelay,
    longPressDelay,
    onTap: onTap ? () => onTap() : undefined,
    onDoubleTap: onDoubleTap ? () => onDoubleTap() : undefined,
    onLongPress: onLongPress ? () => onLongPress() : undefined,
    preventDefault: false,
    stopPropagation: false,
  });
}

// ============================================
// Screen Edge Swipe Hook (for navigation)
// ============================================

export interface EdgeSwipeConfig {
  edgeWidth?: number; // Width of edge detection zone (default: 20px)
  onEdgeSwipeLeft?: () => void;
  onEdgeSwipeRight?: () => void;
}

export function useEdgeSwipe(config: EdgeSwipeConfig) {
  const { edgeWidth = 20, onEdgeSwipeLeft, onEdgeSwipeRight } = config;

  const touchStart = useRef<{ x: number; y: number; edge: 'left' | 'right' | null }>({
    x: 0,
    y: 0,
    edge: null,
  });

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const screenWidth = window.innerWidth;

      let edge: 'left' | 'right' | null = null;
      if (touch.clientX <= edgeWidth) {
        edge = 'left';
      } else if (touch.clientX >= screenWidth - edgeWidth) {
        edge = 'right';
      }

      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        edge,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const { edge, x: startX } = touchStart.current;
      if (!edge) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - touchStart.current.y);

      // Only trigger if horizontal swipe and not too much vertical movement
      if (Math.abs(deltaX) > 50 && deltaY < 100) {
        if (edge === 'left' && deltaX > 0 && onEdgeSwipeRight) {
          vibrate(15);
          onEdgeSwipeRight();
        } else if (edge === 'right' && deltaX < 0 && onEdgeSwipeLeft) {
          vibrate(15);
          onEdgeSwipeLeft();
        }
      }

      touchStart.current.edge = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [edgeWidth, onEdgeSwipeLeft, onEdgeSwipeRight]);
}

export default useMobileGestures;
