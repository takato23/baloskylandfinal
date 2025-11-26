/**
 * Skateboard Physics Hook
 * Comprehensive skateboard state management and physics calculations
 * Handles movement, tricks, ground detection, and audio
 */

import { useRef, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import { Vector3 } from 'three';
import { useGameStore } from '../store';
import { useGameInput, getMovementDirection } from './useGameInput';
import { playSound } from '../utils/audio';
import { PHYSICS } from '../config/physics';
import type { GameInput } from '../types';

// ============================================
// Types
// ============================================

export type TrickType = 'none' | 'ollie' | 'kickflip' | 'shuvit' | 'heelflip';

export interface TrickRotation {
  x: number;
  y: number;
  z: number;
}

export interface SkateboardState {
  speed: number;
  rotation: number;
  isGrounded: boolean;
  currentTrick: TrickType;
  trickProgress: number;
  trickRotation: TrickRotation;
  canPush: boolean;
  canTrick: boolean;
  canDismount: boolean;
}

export interface SkateboardControls {
  push: () => void;
  brake: () => void;
  turn: (direction: -1 | 0 | 1) => void;
  ollie: () => void;
  kickflip: () => void;
  shuvit: () => void;
  dismount: () => void;
}

// ============================================
// Constants (from PHYSICS config)
// ============================================

const {
  PUSH_FORCE,
  MAX_SPEED,
  FRICTION,
  AIR_FRICTION,
  BRAKE_FRICTION,
  TURN_SPEED,
  TURN_SPEED_FACTOR,
  OLLIE_FORCE,
  KICKFLIP_ROTATION,
  KICKFLIP_DURATION,
  PUSH_COOLDOWN,
  TRICK_COOLDOWN,
  DISMOUNT_DELAY,
} = PHYSICS.SKATEBOARD;

// Trick configurations
const TRICK_CONFIG = {
  ollie: {
    force: OLLIE_FORCE,
    duration: KICKFLIP_DURATION * 0.8,
    rotation: { x: 0.3, y: 0, z: 0 },
  },
  kickflip: {
    force: OLLIE_FORCE,
    duration: KICKFLIP_DURATION,
    rotation: { x: 0, y: 0, z: KICKFLIP_ROTATION },
  },
  shuvit: {
    force: OLLIE_FORCE * 0.9,
    duration: KICKFLIP_DURATION,
    rotation: { x: 0, y: Math.PI, z: 0 },
  },
  heelflip: {
    force: OLLIE_FORCE,
    duration: KICKFLIP_DURATION,
    rotation: { x: 0, y: 0, z: -KICKFLIP_ROTATION },
  },
} as const;

// Ground detection threshold
const GROUND_Y_VELOCITY_THRESHOLD = 1.0;
const GROUND_Y_MAX = 2;

// ============================================
// Reusable Vector Objects (GC optimization)
// ============================================

const _forward = new Vector3();
const _velocity = new Vector3();
const _axis = new Vector3(0, 1, 0);

// ============================================
// Main Hook
// ============================================

export function useSkateboard(
  rigidBodyRef: React.RefObject<RapierRigidBody>,
  enabled: boolean = true
) {
  // Store state
  const setDriving = useGameStore((s) => s.setDriving);
  const setSkateboardSpeed = useGameStore((s) => s.setSkateboardSpeed);
  const setCurrentTrick = useGameStore((s) => s.setCurrentTrick);
  const setTrickCombo = useGameStore((s) => s.setTrickCombo);
  const mobileInput = useGameStore((s) => s.mobileInput);

  // Get input
  const input = useGameInput();

  // Performance-critical refs (updated every frame)
  const speedRef = useRef(0);
  const rotationRef = useRef(0);
  const velocityMagnitudeRef = useRef(0);

  // Cooldown timers
  const pushTimerRef = useRef(0);
  const trickTimerRef = useRef(0);
  const dismountTimerRef = useRef(DISMOUNT_DELAY);
  const lastPushTimeRef = useRef(0);
  const lastLandTimeRef = useRef(0);

  // Trick state
  const currentTrickRef = useRef<TrickType>('none');
  const trickProgressRef = useRef(0);
  const trickRotationRef = useRef<TrickRotation>({ x: 0, y: 0, z: 0 });
  const comboCountRef = useRef(0);

  // Ground state
  const isGroundedRef = useRef(true);
  const wasGroundedRef = useRef(true);

  // Audio
  const rollingSoundRef = useRef<any>(null);

  // ============================================
  // Physics Calculations
  // ============================================

  /**
   * Calculate ground state based on physics
   */
  const checkGrounded = useCallback((vel: { x: number; y: number; z: number }, posY: number): boolean => {
    return Math.abs(vel.y) < GROUND_Y_VELOCITY_THRESHOLD && posY < GROUND_Y_MAX;
  }, []);

  /**
   * Calculate friction based on ground state
   */
  const calculateFriction = useCallback((isGrounded: boolean, isBraking: boolean): number => {
    if (isBraking && isGrounded) return BRAKE_FRICTION;
    return isGrounded ? FRICTION : AIR_FRICTION;
  }, []);

  /**
   * Calculate turn rate based on speed
   */
  const calculateTurnRate = useCallback((speed: number): number => {
    const speedFactor = 1 - Math.min(speed / MAX_SPEED, 0.7) * TURN_SPEED_FACTOR;
    return TURN_SPEED * speedFactor;
  }, []);

  /**
   * Apply push force
   */
  const applyPush = useCallback((currentSpeed: number, delta: number): number => {
    const pushIncrement = PUSH_FORCE * delta * 60;
    return Math.min(currentSpeed + pushIncrement, MAX_SPEED);
  }, []);

  // ============================================
  // Trick System
  // ============================================

  /**
   * Execute a trick
   */
  const executeTrick = useCallback((trickType: TrickType, withShift: boolean = false) => {
    if (!enabled || !isGroundedRef.current || trickTimerRef.current > 0) return false;
    if (currentTrickRef.current !== 'none') return false;

    const rigidBody = rigidBodyRef.current;
    if (!rigidBody) return false;

    // Determine trick type based on input
    let trick: TrickType = 'ollie';
    if (withShift) {
      trick = trickType === 'ollie' ? 'kickflip' : trickType;
    }

    const config = TRICK_CONFIG[trick as keyof typeof TRICK_CONFIG] || TRICK_CONFIG.ollie;

    // Apply jump force
    rigidBody.applyImpulse({ x: 0, y: config.force, z: 0 }, true);

    // Set trick state
    currentTrickRef.current = trick;
    trickProgressRef.current = 0;
    trickTimerRef.current = TRICK_COOLDOWN;

    // Update store
    setCurrentTrick(trick);

    // Play sound
    playSound('jump');

    // Combo tracking
    const now = Date.now();
    if (now - lastLandTimeRef.current < 2000) {
      comboCountRef.current += 1;
      setTrickCombo(comboCountRef.current);
    } else {
      comboCountRef.current = 1;
      setTrickCombo(1);
    }

    return true;
  }, [enabled, rigidBodyRef, setCurrentTrick, setTrickCombo]);

  /**
   * Update trick animation
   */
  const updateTrick = useCallback((delta: number) => {
    if (currentTrickRef.current === 'none') return;

    trickProgressRef.current += delta / KICKFLIP_DURATION;

    if (trickProgressRef.current >= 1) {
      // Trick complete
      currentTrickRef.current = 'none';
      trickProgressRef.current = 0;
      trickRotationRef.current = { x: 0, y: 0, z: 0 };
      setCurrentTrick(null);
    } else {
      // Animate trick
      const config = TRICK_CONFIG[currentTrickRef.current as keyof typeof TRICK_CONFIG];
      if (config) {
        const progress = trickProgressRef.current;
        const easedProgress = Math.sin(progress * Math.PI);

        trickRotationRef.current = {
          x: easedProgress * config.rotation.x,
          y: easedProgress * config.rotation.y,
          z: easedProgress * config.rotation.z,
        };
      }
    }
  }, [setCurrentTrick]);

  /**
   * Handle landing detection
   */
  const handleLanding = useCallback(() => {
    if (!wasGroundedRef.current && isGroundedRef.current) {
      // Just landed
      lastLandTimeRef.current = Date.now();

      if (currentTrickRef.current !== 'none') {
        // Landed during trick - failed trick
        currentTrickRef.current = 'none';
        trickProgressRef.current = 0;
        trickRotationRef.current = { x: 0, y: 0, z: 0 };
        comboCountRef.current = 0;
        setCurrentTrick(null);
        setTrickCombo(0);
        playSound('step'); // Landing sound
      } else if (comboCountRef.current > 0) {
        // Clean landing after trick
        playSound('jump'); // Success sound
      }
    }
  }, [setCurrentTrick, setTrickCombo]);

  // ============================================
  // Control Interface
  // ============================================

  const controls: SkateboardControls = useMemo(() => ({
    push: () => {
      if (pushTimerRef.current <= 0 && isGroundedRef.current) {
        velocityMagnitudeRef.current = applyPush(velocityMagnitudeRef.current, 1/60);
        pushTimerRef.current = PUSH_COOLDOWN;

        const now = Date.now();
        if (now - lastPushTimeRef.current > 300) {
          playSound('step');
          lastPushTimeRef.current = now;
        }
      }
    },

    brake: () => {
      if (isGroundedRef.current) {
        velocityMagnitudeRef.current *= BRAKE_FRICTION;
        if (velocityMagnitudeRef.current < 0.1) {
          velocityMagnitudeRef.current = 0;
        }
      }
    },

    turn: (direction: -1 | 0 | 1) => {
      if (direction !== 0 && velocityMagnitudeRef.current > 0.5) {
        const turnRate = calculateTurnRate(velocityMagnitudeRef.current);
        rotationRef.current += direction * turnRate * (1/60);
      }
    },

    ollie: () => executeTrick('ollie', false),
    kickflip: () => executeTrick('kickflip', true),
    shuvit: () => executeTrick('shuvit', true),

    dismount: () => {
      if (dismountTimerRef.current <= 0) {
        setDriving(false);
        playSound('jump');
      }
    },
  }), [applyPush, calculateTurnRate, executeTrick, setDriving]);

  // ============================================
  // Frame Update
  // ============================================

  useFrame((state, delta) => {
    if (!enabled || !rigidBodyRef.current) return;

    const dt = Math.min(delta, 0.1);
    const rigidBody = rigidBodyRef.current;

    // Get physics state
    const vel = rigidBody.linvel();
    const pos = rigidBody.translation();

    // Update timers
    pushTimerRef.current = Math.max(0, pushTimerRef.current - dt);
    trickTimerRef.current = Math.max(0, trickTimerRef.current - dt);
    dismountTimerRef.current = Math.max(0, dismountTimerRef.current - dt);

    // Ground detection
    wasGroundedRef.current = isGroundedRef.current;
    isGroundedRef.current = checkGrounded(vel, pos.y);

    // Handle landing
    handleLanding();

    // Process input
    const direction = getMovementDirection(input);
    const wantJump = input.jump;
    const wantTrick = input.run; // Shift for tricks
    const wantDismount = input.interact;

    // Dismount
    if (wantDismount && dismountTimerRef.current <= 0) {
      controls.dismount();
      return;
    }

    // Turning
    const turnInput = direction.x;
    if (turnInput !== 0) {
      controls.turn(turnInput > 0 ? 1 : -1);
    }

    // Pushing (forward)
    if (direction.z < 0 && pushTimerRef.current <= 0 && isGroundedRef.current && currentTrickRef.current === 'none') {
      velocityMagnitudeRef.current = applyPush(velocityMagnitudeRef.current, dt);
      pushTimerRef.current = PUSH_COOLDOWN;

      const now = Date.now();
      if (now - lastPushTimeRef.current > 300) {
        playSound('step');
        lastPushTimeRef.current = now;
      }
    }

    // Braking (backward)
    if (direction.z > 0 && isGroundedRef.current) {
      controls.brake();
    }

    // Tricks
    updateTrick(dt);

    if (wantJump && isGroundedRef.current && trickTimerRef.current <= 0 && currentTrickRef.current === 'none') {
      if (wantTrick) {
        // Advanced trick (kickflip by default, can be extended)
        executeTrick('kickflip', true);
      } else {
        // Regular ollie
        executeTrick('ollie', false);
      }
    }

    // Apply friction
    const friction = calculateFriction(isGroundedRef.current, direction.z > 0);
    velocityMagnitudeRef.current *= friction;
    if (velocityMagnitudeRef.current < 0.05) {
      velocityMagnitudeRef.current = 0;
    }

    // Apply velocity
    _forward.set(0, 0, -1).applyAxisAngle(_axis, rotationRef.current);
    _velocity.copy(_forward).multiplyScalar(velocityMagnitudeRef.current);

    rigidBody.setLinvel({ x: _velocity.x, y: vel.y, z: _velocity.z }, true);

    // Update state
    speedRef.current = velocityMagnitudeRef.current;
    setSkateboardSpeed(velocityMagnitudeRef.current);

    // Update rolling sound
    if (rollingSoundRef.current && isGroundedRef.current) {
      const { filter, gainNode, ctx } = rollingSoundRef.current;
      const speedRatio = Math.min(velocityMagnitudeRef.current / MAX_SPEED, 1);

      const targetFreq = 200 + speedRatio * 600;
      const targetVol = velocityMagnitudeRef.current > 0.5 ? 0.05 + speedRatio * 0.15 : 0;

      filter.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
      gainNode.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.1);
    }
  });

  // ============================================
  // Public State
  // ============================================

  const state: SkateboardState = {
    speed: speedRef.current,
    rotation: rotationRef.current,
    isGrounded: isGroundedRef.current,
    currentTrick: currentTrickRef.current,
    trickProgress: trickProgressRef.current,
    trickRotation: trickRotationRef.current,
    canPush: pushTimerRef.current <= 0,
    canTrick: trickTimerRef.current <= 0,
    canDismount: dismountTimerRef.current <= 0,
  };

  // ============================================
  // Sound Management
  // ============================================

  /**
   * Initialize rolling sound
   */
  const startRollingSound = useCallback(() => {
    if (!rollingSoundRef.current) {
      const sound = playSound('rolling');
      if (sound && typeof sound === 'object') {
        rollingSoundRef.current = sound;
      }
    }
  }, []);

  /**
   * Stop rolling sound
   */
  const stopRollingSound = useCallback(() => {
    if (rollingSoundRef.current) {
      const { noise, gainNode, ctx } = rollingSoundRef.current;
      gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      setTimeout(() => {
        try {
          noise.stop();
          noise.disconnect();
        } catch {}
      }, 200);
      rollingSoundRef.current = null;
    }
  }, []);

  return {
    state,
    controls,
    startRollingSound,
    stopRollingSound,
    // Expose refs for direct access (advanced usage)
    refs: {
      speed: speedRef,
      rotation: rotationRef,
      velocityMagnitude: velocityMagnitudeRef,
      isGrounded: isGroundedRef,
      currentTrick: currentTrickRef,
      trickRotation: trickRotationRef,
    },
  };
}
