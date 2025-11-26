# Skateboard Hook Usage Guide

This guide explains how to use the `useSkateboard` hook in the Cozy City Explorer game.

## Overview

The `useSkateboard` hook provides a comprehensive skateboard physics and state management system for React Three Fiber. It handles:

- Physics calculations (speed, friction, turning)
- Trick execution (ollie, kickflip, shuvit, heelflip)
- Ground detection
- Input processing (keyboard + mobile)
- Sound effects
- Combo tracking

## Installation

The hook is already integrated into the project at `/hooks/useSkateboard.ts`.

## Basic Usage

```typescript
import { useSkateboard } from '../hooks';
import { useRef } from 'react';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';

function SkateboardComponent() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const isDriving = useGameStore(s => s.isDriving);

  const { state, controls, startRollingSound, stopRollingSound } = useSkateboard(
    rigidBodyRef,
    isDriving && vehicleType === 'skateboard'
  );

  // Initialize/cleanup sound effects
  useEffect(() => {
    if (isDriving) {
      startRollingSound();
    }
    return () => stopRollingSound();
  }, [isDriving, startRollingSound, stopRollingSound]);

  return (
    <RigidBody ref={rigidBodyRef} type="dynamic">
      {/* Your skateboard visual model */}
    </RigidBody>
  );
}
```

## API Reference

### Hook Parameters

```typescript
useSkateboard(
  rigidBodyRef: React.RefObject<RapierRigidBody>,
  enabled: boolean = true
)
```

- `rigidBodyRef`: Reference to the skateboard's physics body
- `enabled`: Whether the hook is active (use for mounting/unmounting)

### Return Value

```typescript
{
  state: SkateboardState,
  controls: SkateboardControls,
  startRollingSound: () => void,
  stopRollingSound: () => void,
  refs: {
    speed: React.MutableRefObject<number>,
    rotation: React.MutableRefObject<number>,
    velocityMagnitude: React.MutableRefObject<number>,
    isGrounded: React.MutableRefObject<boolean>,
    currentTrick: React.MutableRefObject<TrickType>,
    trickRotation: React.MutableRefObject<TrickRotation>,
  }
}
```

### SkateboardState

```typescript
interface SkateboardState {
  speed: number;                // Current speed (0 to MAX_SPEED)
  rotation: number;             // Y-axis rotation in radians
  isGrounded: boolean;          // Is the skateboard on the ground?
  currentTrick: TrickType;      // 'none' | 'ollie' | 'kickflip' | 'shuvit' | 'heelflip'
  trickProgress: number;        // 0-1 for animation
  trickRotation: TrickRotation; // { x, y, z } for visual rotation
  canPush: boolean;             // Can push right now?
  canTrick: boolean;            // Can do trick right now?
  canDismount: boolean;         // Can dismount right now?
}
```

### SkateboardControls

```typescript
interface SkateboardControls {
  push: () => void;              // Apply push force
  brake: () => void;             // Apply braking
  turn: (direction: -1 | 0 | 1) => void;  // Turn left/right
  ollie: () => void;             // Perform ollie
  kickflip: () => void;          // Perform kickflip
  shuvit: () => void;            // Perform shuvit
  dismount: () => void;          // Exit skateboard
}
```

## Visual Integration

Use the `state.trickRotation` to animate your skateboard model:

```typescript
<group rotation={[
  state.trickRotation.x,
  state.trickRotation.y,
  state.trickRotation.z
]}>
  <SkateboardModel wheelSpeed={state.speed} />
</group>
```

## Store Integration

The hook automatically updates the global store:

```typescript
// Access from any component
const skateboardSpeed = useGameStore(s => s.skateboardSpeed);
const currentTrick = useGameStore(s => s.currentTrick);
const trickCombo = useGameStore(s => s.trickCombo);

// Or use the selector for better performance
const skateState = useGameStore(selectSkateboardState);
```

## Physics Configuration

All physics constants are centralized in `/config/physics.ts`:

```typescript
PHYSICS.SKATEBOARD = {
  PUSH_FORCE: 12,
  MAX_SPEED: 18,
  FRICTION: 0.98,
  AIR_FRICTION: 0.995,
  BRAKE_FRICTION: 0.92,
  TURN_SPEED: 2.5,
  TURN_SPEED_FACTOR: 0.15,
  OLLIE_FORCE: 12,
  KICKFLIP_ROTATION: Math.PI * 2,
  KICKFLIP_DURATION: 0.5,
  PUSH_COOLDOWN: 0.4,
  TRICK_COOLDOWN: 0.6,
  DISMOUNT_DELAY: 0.5,
}
```

## Input Handling

The hook uses `useGameInput` which unifies keyboard and mobile controls:

- **Forward**: W / Up / Joystick Up → Push
- **Backward**: S / Down / Joystick Down → Brake
- **Left/Right**: A/D / Left/Right / Joystick → Turn
- **Jump**: Space / Jump Button → Ollie
- **Jump + Run**: Space+Shift / Jump+Run Button → Kickflip
- **Interact**: E / Interact Button → Dismount

## Trick System

### Basic Tricks

1. **Ollie**: Jump button while grounded
2. **Kickflip**: Jump + Run buttons while grounded
3. **Shuvit**: Available via `controls.shuvit()`
4. **Heelflip**: Reserved for future implementation

### Combo System

- Landing tricks within 2 seconds increases combo
- Failed landings (landing during trick) reset combo
- Combo counter available in store: `useGameStore(s => s.trickCombo)`

### Trick Configuration

Tricks are configured in `/hooks/useSkateboard.ts`:

```typescript
const TRICK_CONFIG = {
  ollie: {
    force: 12,
    duration: 0.4,
    rotation: { x: 0.3, y: 0, z: 0 },
  },
  kickflip: {
    force: 12,
    duration: 0.5,
    rotation: { x: 0, y: 0, z: Math.PI * 2 },
  },
  // ...
}
```

## Advanced Usage

### Direct Ref Access

For performance-critical operations, access refs directly:

```typescript
const { refs } = useSkateboard(rigidBodyRef, true);

// In useFrame (no re-renders)
useFrame(() => {
  const currentSpeed = refs.speed.current;
  const isInAir = !refs.isGrounded.current;
  // ...
});
```

### Custom Trick Implementation

Extend the hook with custom tricks:

```typescript
// After hook initialization
const executeCustomTrick = () => {
  if (state.canTrick && state.isGrounded) {
    // Custom trick logic
    rigidBodyRef.current?.applyImpulse({ x: 0, y: 15, z: 0 }, true);
    playSound('jump');
  }
};
```

## Performance Optimization

The hook is optimized for performance:

1. **Refs for frame data**: Speed, rotation, etc. use refs to avoid re-renders
2. **Reusable Vector3 objects**: Avoid garbage collection pressure
3. **Memoized callbacks**: Control functions are memoized
4. **Minimal state updates**: Only reactive state updates on significant changes

## Sound Effects

The hook manages these sounds automatically:

- **Rolling**: Continuous sound based on speed (frequency + volume)
- **Step**: Push sounds with cooldown
- **Jump**: Trick/landing sounds

Control rolling sound manually:

```typescript
const { startRollingSound, stopRollingSound } = useSkateboard(...);

useEffect(() => {
  startRollingSound();
  return () => stopRollingSound();
}, []);
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  TrickType,
  TrickRotation,
  SkateboardState,
  SkateboardControls
} from '../hooks';
```

## Migration from Old Implementation

If updating from the inline implementation in `Vehicle.tsx`:

### Before
```typescript
// State scattered throughout component
const [speed, setSpeed] = useState(0);
const rotation = useRef(0);
const pushTimer = useRef(0);
// Manual physics in useFrame
useFrame(() => {
  // 200+ lines of physics code
});
```

### After
```typescript
const { state, controls } = useSkateboard(rigidBodyRef, isActive);
// Physics handled automatically!
```

## Troubleshooting

### Skateboard not responding
- Check `enabled` parameter is true
- Verify `rigidBodyRef.current` exists
- Ensure physics body is `type="dynamic"`

### Tricks not working
- Check ground detection (try adjusting `GROUND_Y_MAX` constant)
- Verify cooldowns haven't been triggered
- Ensure physics body isn't sleeping

### Sound not playing
- Call `startRollingSound()` when mounting
- Check `utils/audio.ts` has 'rolling' sound type
- Verify Web Audio API is initialized

## Examples

### Full Component Example

```typescript
import React, { useRef, useEffect } from 'react';
import { RigidBody, RapierRigidBody, CuboidCollider } from '@react-three/rapier';
import { useSkateboard } from '../hooks';
import { useGameStore } from '../store';

export const Skateboard: React.FC = () => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const isDriving = useGameStore(s => s.isDriving);
  const vehicleType = useGameStore(s => s.vehicleType);

  const isActive = isDriving && vehicleType === 'skateboard';

  const {
    state,
    controls,
    startRollingSound,
    stopRollingSound,
  } = useSkateboard(rigidBodyRef, isActive);

  useEffect(() => {
    if (isActive) {
      startRollingSound();
    }
    return () => stopRollingSound();
  }, [isActive, startRollingSound, stopRollingSound]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders={false}
      position={[0, 1, 0]}
      mass={10}
      linearDamping={0.1}
      angularDamping={5}
      lockRotations
    >
      <CuboidCollider args={[0.15, 0.05, 0.4]} />

      <group
        rotation-y={state.rotation}
        rotation={[
          state.trickRotation.x,
          state.trickRotation.y,
          state.trickRotation.z,
        ]}
      >
        <SkateboardModel wheelSpeed={state.speed} />
      </group>
    </RigidBody>
  );
};
```

### UI Integration Example

```typescript
// Display skateboard stats in UI
function SkateboardHUD() {
  const { skateboardSpeed, currentTrick, trickCombo } = useGameStore(
    selectSkateboardState
  );

  return (
    <div className="skateboard-hud">
      <div>Speed: {skateboardSpeed.toFixed(1)}</div>
      {currentTrick && <div>Trick: {currentTrick}</div>}
      {trickCombo > 1 && <div>Combo: x{trickCombo}</div>}
    </div>
  );
}
```

## Best Practices

1. **Always cleanup sounds**: Use `useEffect` cleanup to stop rolling sound
2. **Check enabled state**: Pass correct enabled flag to prevent unnecessary calculations
3. **Use selectors**: Use `selectSkateboardState` for better performance
4. **Avoid direct ref mutation**: Use provided controls instead
5. **Test mobile input**: Verify joystick and button controls work correctly

## Further Customization

To add new features:

1. **New tricks**: Add to `TRICK_CONFIG` in `/hooks/useSkateboard.ts`
2. **Physics tuning**: Modify `/config/physics.ts` constants
3. **Custom sounds**: Add sound types to `/types/game.ts` and `/utils/audio.ts`
4. **Store integration**: Add state to `/store.ts` skateboard section
