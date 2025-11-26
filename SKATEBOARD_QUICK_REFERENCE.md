# Skateboard Hook Quick Reference

## Import

```typescript
import { useSkateboard } from '../hooks';
import type { SkateboardState, SkateboardControls, TrickType } from '../hooks';
```

## Basic Usage

```typescript
const { state, controls, startRollingSound, stopRollingSound } = useSkateboard(
  rigidBodyRef,
  enabled
);
```

## State Properties

| Property | Type | Description |
|----------|------|-------------|
| `state.speed` | `number` | Current speed (0 to 18) |
| `state.rotation` | `number` | Y-axis rotation (radians) |
| `state.isGrounded` | `boolean` | Is on ground? |
| `state.currentTrick` | `TrickType` | Active trick name |
| `state.trickProgress` | `number` | Animation progress (0-1) |
| `state.trickRotation` | `{x,y,z}` | Visual rotation for tricks |
| `state.canPush` | `boolean` | Can push now? |
| `state.canTrick` | `boolean` | Can trick now? |
| `state.canDismount` | `boolean` | Can dismount now? |

## Control Methods

| Method | Description |
|--------|-------------|
| `controls.push()` | Apply push force |
| `controls.brake()` | Apply braking |
| `controls.turn(dir)` | Turn (-1=left, 1=right) |
| `controls.ollie()` | Basic jump |
| `controls.kickflip()` | Barrel roll trick |
| `controls.shuvit()` | 180° rotation |
| `controls.dismount()` | Exit skateboard |

## Store Access

```typescript
// Individual values
const speed = useGameStore(s => s.skateboardSpeed);
const trick = useGameStore(s => s.currentTrick);
const combo = useGameStore(s => s.trickCombo);

// All at once (recommended)
const skateState = useGameStore(selectSkateboardState);
```

## Physics Constants

```typescript
PHYSICS.SKATEBOARD = {
  PUSH_FORCE: 12,
  MAX_SPEED: 18,
  FRICTION: 0.98,
  TURN_SPEED: 2.5,
  OLLIE_FORCE: 12,
  PUSH_COOLDOWN: 0.4,
  TRICK_COOLDOWN: 0.6,
}
```

## Trick Types

```typescript
type TrickType =
  | 'none'      // No trick active
  | 'ollie'     // Basic jump
  | 'kickflip'  // Barrel roll
  | 'shuvit'    // 180° spin
  | 'heelflip'  // Reverse barrel roll
```

## Input Mapping

| Action | Keyboard | Mobile |
|--------|----------|--------|
| Push | W / ↑ | Joystick ↑ |
| Brake | S / ↓ | Joystick ↓ |
| Turn L | A / ← | Joystick ← |
| Turn R | D / → | Joystick → |
| Ollie | Space | Jump Button |
| Kickflip | Space+Shift | Jump+Run |
| Dismount | E | Interact |

## Common Patterns

### Initialize with sound
```typescript
useEffect(() => {
  if (isActive) startRollingSound();
  return () => stopRollingSound();
}, [isActive]);
```

### Apply trick rotation
```typescript
<group rotation={[
  state.trickRotation.x,
  state.trickRotation.y,
  state.trickRotation.z
]}>
  <SkateboardModel />
</group>
```

### Display UI
```typescript
{state.speed > 0 && (
  <div>Speed: {state.speed.toFixed(1)}</div>
)}
{state.currentTrick !== 'none' && (
  <div>Trick: {state.currentTrick}</div>
)}
{trickCombo > 1 && (
  <div>Combo: x{trickCombo}</div>
)}
```

### Manual trick trigger
```typescript
const handleTrick = () => {
  if (state.canTrick) {
    controls.kickflip();
  }
};
```

## Performance Tips

1. Use `selectSkateboardState` selector for better performance
2. Access `refs` directly in `useFrame` to avoid re-renders
3. Cleanup sounds in `useEffect` return function
4. Keep enabled flag updated to prevent unnecessary calculations

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No movement | Check `enabled` is true, verify RigidBody is dynamic |
| No tricks | Ensure grounded, check cooldown timers |
| No sound | Call `startRollingSound()` on mount |
| Jittery physics | Verify delta clamping in useFrame |

## File Locations

- Hook: `/hooks/useSkateboard.ts`
- Types: `/hooks/index.ts` (exports)
- Store: `/store.ts` (state management)
- Physics: `/config/physics.ts` (constants)
- Docs: `SKATEBOARD_HOOK_USAGE.md` (full guide)
