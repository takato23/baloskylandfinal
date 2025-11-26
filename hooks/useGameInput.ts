/**
 * Unified Game Input Hook
 * Combines keyboard and mobile touch controls into a single interface
 */

import { useMemo } from 'react';
import { useKeyboardControls } from '@react-three/drei';
import { useGameStore, Controls } from '../store';
import type { GameInput } from '../types';

// Joystick thresholds
const JOYSTICK_THRESHOLD = 0.3;
const JOYSTICK_RUN_THRESHOLD = 0.8;

/**
 * Get unified input from keyboard and mobile controls
 * Usage: const input = useGameInput();
 */
export function useGameInput(): GameInput {
  const [, getKeys] = useKeyboardControls<keyof typeof Controls>();
  const mobileInput = useGameStore((s) => s.mobileInput);

  const input = useMemo(() => {
    const keys = getKeys();
    const { joystick, buttons } = mobileInput;

    // Combine keyboard and mobile inputs
    return {
      forward: keys.forward || joystick.y < -JOYSTICK_THRESHOLD,
      backward: keys.backward || joystick.y > JOYSTICK_THRESHOLD,
      left: keys.left || joystick.x < -JOYSTICK_THRESHOLD,
      right: keys.right || joystick.x > JOYSTICK_THRESHOLD,
      jump: keys.jump || buttons.jump,
      run: keys.run || buttons.run || (joystick.active && (Math.abs(joystick.x) > JOYSTICK_RUN_THRESHOLD || Math.abs(joystick.y) > JOYSTICK_RUN_THRESHOLD)),
      interact: keys.interact || buttons.interact,
      horn: keys.horn || buttons.horn,
    };
  }, [getKeys, mobileInput]);

  return input;
}

/**
 * Get raw input state (for useFrame where we need fresh values each frame)
 * This bypasses React's render cycle for performance
 */
export function getRawInput(): GameInput {
  // Note: This requires access to keyboard state outside of React
  // We'll use the store's mobileInput and assume keyboard state is handled separately
  const mobileInput = useGameStore.getState().mobileInput;
  const { joystick, buttons } = mobileInput;

  return {
    forward: joystick.y < -JOYSTICK_THRESHOLD,
    backward: joystick.y > JOYSTICK_THRESHOLD,
    left: joystick.x < -JOYSTICK_THRESHOLD,
    right: joystick.x > JOYSTICK_THRESHOLD,
    jump: buttons.jump,
    run: buttons.run || (joystick.active && (Math.abs(joystick.x) > JOYSTICK_RUN_THRESHOLD || Math.abs(joystick.y) > JOYSTICK_RUN_THRESHOLD)),
    interact: buttons.interact,
    horn: buttons.horn,
  };
}

/**
 * Calculate movement direction from input
 * Returns normalized direction vector [x, z] for ground movement
 */
export function getMovementDirection(input: GameInput): { x: number; z: number } {
  const mobileInput = useGameStore.getState().mobileInput;

  // If mobile joystick is active, use its values directly
  if (mobileInput.joystick.active) {
    const x = mobileInput.joystick.x;
    const z = mobileInput.joystick.y;
    const length = Math.sqrt(x * x + z * z);

    if (length > 1) {
      return { x: x / length, z: z / length };
    }
    return { x, z };
  }

  // Otherwise use keyboard input
  let x = 0;
  let z = 0;

  if (input.forward) z -= 1;
  if (input.backward) z += 1;
  if (input.left) x -= 1;
  if (input.right) x += 1;

  // Normalize diagonal movement
  const length = Math.sqrt(x * x + z * z);
  if (length > 0) {
    x /= length;
    z /= length;
  }

  return { x, z };
}
