/**
 * useSkateboardEffects Hook
 *
 * Convenience hook that bundles all skateboard effects logic
 * Drop this into your Skateboard component for instant effects
 */

import { useState, useRef, useCallback } from 'react';
import { useComboSystem } from './skateEffects';
import { playSound } from './audio';

export interface SkateboardEffectsState {
  // Visual states
  justLanded: boolean;
  isBraking: boolean;

  // Combo system
  currentTrick: string;
  comboCount: number;
  showPopup: boolean;

  // Methods
  handleLanding: () => void;
  handleBraking: (isBraking: boolean) => void;
  handleTrickComplete: (trickName: 'ollie' | 'kickflip' | 'grind') => void;
  resetTrickPopup: () => void;
}

export interface SkateboardPhysicsState {
  isGrounded: boolean;
  speed: number;
  wantBackward: boolean;
}

const TRICK_NAMES = {
  ollie: 'Ollie!',
  kickflip: 'Kickflip!',
  grind: '50-50 Grind!',
} as const;

/**
 * Main hook for skateboard effects
 */
export const useSkateboardEffects = (): SkateboardEffectsState => {
  // Visual states
  const [justLanded, setJustLanded] = useState(false);
  const [isBraking, setIsBraking] = useState(false);

  // Internal state
  const wasGrounded = useRef(true);

  // Combo system
  const {
    currentTrick,
    comboCount,
    showPopup,
    registerTrick,
    resetCombo,
  } = useComboSystem();

  /**
   * Call when player lands on ground
   * Automatically plays sound and shows dust burst
   */
  const handleLanding = useCallback(() => {
    setJustLanded(true);
    playSound('land');

    // Reset after brief moment
    setTimeout(() => setJustLanded(false), 50);
  }, []);

  /**
   * Call to update braking state
   * Shows dust trail when braking hard
   */
  const handleBraking = useCallback((braking: boolean) => {
    setIsBraking(braking);
  }, []);

  /**
   * Call when trick is successfully completed
   * Plays sounds and shows popup with combo tracking
   */
  const handleTrickComplete = useCallback(
    (trickType: keyof typeof TRICK_NAMES) => {
      const trickName = TRICK_NAMES[trickType];

      // Register for combo system
      registerTrick(trickName);

      // Play trick success sound
      playSound('trick_success');

      // Play combo sound if chaining
      if (comboCount > 1) {
        playSound('combo');
      }
    },
    [registerTrick, comboCount]
  );

  /**
   * Call when trick popup animation completes
   */
  const resetTrickPopup = useCallback(() => {
    resetCombo();
  }, [resetCombo]);

  return {
    // State
    justLanded,
    isBraking,
    currentTrick,
    comboCount,
    showPopup,

    // Methods
    handleLanding,
    handleBraking,
    handleTrickComplete,
    resetTrickPopup,
  };
};

/**
 * Helper hook for automatic landing detection
 * Compares current grounded state with previous frame
 */
export const useAutoLandingDetection = (
  isGrounded: boolean,
  onLanding: () => void
) => {
  const wasGrounded = useRef(isGrounded);

  // Detect transition from air to ground
  if (isGrounded && !wasGrounded.current) {
    onLanding();
  }

  wasGrounded.current = isGrounded;
};

/**
 * Helper to calculate braking state
 */
export const calculateBrakingState = (
  physics: SkateboardPhysicsState
): boolean => {
  const MIN_BRAKING_SPEED = 3;
  return (
    physics.wantBackward &&
    physics.isGrounded &&
    physics.speed > MIN_BRAKING_SPEED
  );
};

/**
 * Example Usage:
 *
 * const Skateboard = () => {
 *   const [speed, setSpeed] = useState(0);
 *   const [isGrounded, setIsGrounded] = useState(true);
 *
 *   // Add effects hook
 *   const effects = useSkateboardEffects();
 *
 *   useFrame(() => {
 *     // ... physics code ...
 *
 *     // Auto-detect landing
 *     useAutoLandingDetection(isGrounded, effects.handleLanding);
 *
 *     // Update braking
 *     const braking = calculateBrakingState({
 *       isGrounded,
 *       speed,
 *       wantBackward
 *     });
 *     effects.handleBraking(braking);
 *
 *     // When trick completes
 *     if (trickComplete) {
 *       effects.handleTrickComplete('kickflip');
 *     }
 *   });
 *
 *   return (
 *     <RigidBody>
 *       <SkateboardModel />
 *
 *       <SpeedLines ... />
 *       <DustParticles
 *         justLanded={effects.justLanded}
 *         isBraking={effects.isBraking}
 *         ...
 *       />
 *       <TrickPopup
 *         visible={effects.showPopup}
 *         trickName={effects.currentTrick}
 *         comboCount={effects.comboCount}
 *         onComplete={effects.resetTrickPopup}
 *       />
 *     </RigidBody>
 *   );
 * };
 */
