/**
 * EmoteWheel Component
 * Radial emote selector that opens on hold (Q key or long-press on mobile)
 * Features: 8-segment wheel, hover preview, touch/mouse support
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store';

// ============================================
// Constants
// ============================================

const EMOTE_CONFIGS = [
  { emoji: '👋', label: 'Wave', action: 'wave' },
  { emoji: '❤️', label: 'Love', action: 'love' },
  { emoji: '😂', label: 'Laugh', action: 'laugh' },
  { emoji: '🎉', label: 'Celebrate', action: 'celebrate' },
  { emoji: '👍', label: 'Thumbs Up', action: 'thumbsup' },
  { emoji: '🔥', label: 'Fire', action: 'fire' },
  { emoji: '⭐', label: 'Star', action: 'star' },
  { emoji: '🎮', label: 'Gaming', action: 'gaming' },
] as const;

const WHEEL_RADIUS = 120; // px
const SEGMENT_ANGLE = (Math.PI * 2) / EMOTE_CONFIGS.length;
const HOLD_DURATION = 300; // ms to activate wheel
const CENTER_DEADZONE = 30; // px radius for center deadzone

// ============================================
// Types
// ============================================

interface EmoteWheelProps {
  onEmote: (emoji: string, action: string) => void;
  isMobile?: boolean;
}

// ============================================
// Emote Wheel Component
// ============================================

export const EmoteWheel: React.FC<EmoteWheelProps> = ({ onEmote, isMobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const holdTimerRef = useRef<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // ============================================
  // Helper Functions
  // ============================================

  const calculateSelectedSegment = useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current) return null;

    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check if in center deadzone
    if (distance < CENTER_DEADZONE) {
      return null;
    }

    // Calculate angle (0 = right, increases counter-clockwise)
    let angle = Math.atan2(-deltaY, deltaX);
    if (angle < 0) angle += Math.PI * 2;

    // Adjust angle to start from top (-90 degrees)
    angle = (angle + Math.PI / 2) % (Math.PI * 2);

    // Calculate segment index
    const segmentIndex = Math.floor(angle / SEGMENT_ANGLE);
    return segmentIndex % EMOTE_CONFIGS.length;
  }, []);

  // ============================================
  // Keyboard Handlers
  // ============================================

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'q' || e.key === 'Q') {
      if (!isOpen && !holdTimerRef.current) {
        // Start hold timer
        holdTimerRef.current = window.setTimeout(() => {
          setIsOpen(true);
          setPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          });
        }, HOLD_DURATION);
      }
    }
  }, [isOpen]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'q' || e.key === 'Q') {
      // Clear hold timer
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      // Send emote if wheel is open and segment selected
      if (isOpen && selectedIndex !== null) {
        const emote = EMOTE_CONFIGS[selectedIndex];
        onEmote(emote.emoji, emote.action);
      }

      setIsOpen(false);
      setSelectedIndex(null);
    }
  }, [isOpen, selectedIndex, onEmote]);

  // ============================================
  // Mouse Handlers
  // ============================================

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isOpen) {
      setMousePos({ x: e.clientX, y: e.clientY });
      const index = calculateSelectedSegment(e.clientX, e.clientY);
      setSelectedIndex(index);
    }
  }, [isOpen, calculateSelectedSegment]);

  // ============================================
  // Touch Handlers (Mobile)
  // ============================================

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isMobile && e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };

      // Start hold timer
      holdTimerRef.current = window.setTimeout(() => {
        setIsOpen(true);
        setPosition({
          x: touch.clientX,
          y: touch.clientY,
        });
      }, HOLD_DURATION);
    }
  }, [isMobile]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isOpen && e.touches.length === 1) {
      const touch = e.touches[0];
      setMousePos({ x: touch.clientX, y: touch.clientY });
      const index = calculateSelectedSegment(touch.clientX, touch.clientY);
      setSelectedIndex(index);
    }
  }, [isOpen, calculateSelectedSegment]);

  const handleTouchEnd = useCallback(() => {
    // Clear hold timer
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Send emote if wheel is open and segment selected
    if (isOpen && selectedIndex !== null) {
      const emote = EMOTE_CONFIGS[selectedIndex];
      onEmote(emote.emoji, emote.action);
    }

    setIsOpen(false);
    setSelectedIndex(null);
    touchStartRef.current = null;
  }, [isOpen, selectedIndex, onEmote]);

  // ============================================
  // Effect Hooks
  // ============================================

  useEffect(() => {
    if (!isMobile) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    window.addEventListener('mousemove', handleMouseMove);

    if (isMobile) {
      window.addEventListener('touchstart', handleTouchStart);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (!isMobile) {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      }
      window.removeEventListener('mousemove', handleMouseMove);

      if (isMobile) {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      }

      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, [
    isMobile,
    handleKeyDown,
    handleKeyUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // ============================================
  // Render
  // ============================================

  if (!isOpen) return null;

  return (
    <div
      ref={wheelRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{
        left: position.x - WHEEL_RADIUS - 50,
        top: position.y - WHEEL_RADIUS - 50,
        width: (WHEEL_RADIUS + 50) * 2,
        height: (WHEEL_RADIUS + 50) * 2,
      }}
    >
      {/* Center dot */}
      <div
        className="absolute bg-white rounded-full shadow-lg"
        style={{
          left: WHEEL_RADIUS + 50 - 5,
          top: WHEEL_RADIUS + 50 - 5,
          width: 10,
          height: 10,
        }}
      />

      {/* Emote segments */}
      {EMOTE_CONFIGS.map((emote, index) => {
        const angle = index * SEGMENT_ANGLE - Math.PI / 2; // Start from top
        const x = WHEEL_RADIUS + 50 + Math.cos(angle) * WHEEL_RADIUS;
        const y = WHEEL_RADIUS + 50 + Math.sin(angle) * WHEEL_RADIUS;
        const isSelected = selectedIndex === index;

        return (
          <div
            key={index}
            className={`
              absolute pointer-events-auto cursor-pointer
              flex items-center justify-center
              rounded-full transition-all duration-150
              ${isSelected
                ? 'bg-blue-500 text-white scale-125 shadow-2xl'
                : 'bg-white/90 text-gray-800 hover:bg-white hover:scale-110 shadow-lg'
              }
            `}
            style={{
              left: x - 32,
              top: y - 32,
              width: 64,
              height: 64,
            }}
            title={emote.label}
          >
            <span className="text-3xl">{emote.emoji}</span>
          </div>
        );
      })}

      {/* Preview label */}
      {selectedIndex !== null && (
        <div
          className="absolute bg-black/80 text-white px-4 py-2 rounded-lg pointer-events-none"
          style={{
            left: WHEEL_RADIUS + 50 - 50,
            top: WHEEL_RADIUS * 2 + 60,
            width: 100,
            textAlign: 'center',
          }}
        >
          <div className="text-2xl mb-1">{EMOTE_CONFIGS[selectedIndex].emoji}</div>
          <div className="text-xs font-medium">{EMOTE_CONFIGS[selectedIndex].label}</div>
        </div>
      )}

      {/* Instructions */}
      <div
        className="absolute bg-black/70 text-white text-xs px-3 py-1 rounded pointer-events-none"
        style={{
          left: WHEEL_RADIUS + 50 - 60,
          top: -30,
          width: 120,
          textAlign: 'center',
        }}
      >
        {isMobile ? 'Release to emote' : 'Release Q to emote'}
      </div>
    </div>
  );
};

// ============================================
// Hook for Emote Wheel Integration
// ============================================

export const useEmoteWheel = (isMobile: boolean = false) => {
  const [showWheel, setShowWheel] = useState(false);

  return {
    showWheel,
    setShowWheel,
    EmoteWheel,
  };
};

export default EmoteWheel;
