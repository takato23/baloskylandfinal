# Skateboard Effects - Quick Start

## What Was Created

### New Files

1. **`utils/skateEffects.tsx`** - Complete effects system
   - SpeedLines component
   - DustParticles component
   - TrickPopup component
   - SkateTrail component
   - useComboSystem hook

2. **`utils/audio.ts`** - Updated with 4 new sounds
   - `'grind'` - Metallic grinding
   - `'land'` - Landing impact
   - `'trick_success'` - Trick completion chime
   - `'combo'` - Combo multiplier sound

3. **`utils/skateEffects.integration.example.tsx`** - Integration guide

4. **`utils/SKATEBOARD_EFFECTS_README.md`** - Full documentation

## Quick Integration (5 Minutes)

### 1. Add Imports to Vehicle.tsx

```tsx
import {
  SpeedLines,
  DustParticles,
  TrickPopup,
  SkateTrail,
  useComboSystem
} from '../utils/skateEffects';
import { playSound } from '../utils/audio';
```

### 2. Add State (inside Skateboard component)

```tsx
// Landing detection
const [justLanded, setJustLanded] = useState(false);
const wasGrounded = useRef(true);

// Braking detection
const [isBraking, setIsBraking] = useState(false);

// Combo system
const { currentTrick, comboCount, showPopup, registerTrick, resetCombo }
  = useComboSystem();
```

### 3. Update useFrame (find the existing trick completion code)

```tsx
// Add landing detection (near ground check)
if (grounded && !wasGrounded.current) {
  setJustLanded(true);
  playSound('land');
  setTimeout(() => setJustLanded(false), 50);
}
wasGrounded.current = grounded;

// Add braking detection (near brake code)
setIsBraking(wantBackward && grounded && velocityMagnitude.current > 3);

// Update existing trick completion (around line 314-318)
if (trickProgress.current >= 1) {
  // Add these lines:
  const trickName = currentTrick.current === 'kickflip'
    ? 'Kickflip!'
    : 'Ollie!';

  registerTrick(trickName);
  playSound('trick_success');

  if (comboCount > 1) {
    playSound('combo');
  }

  // Keep existing code:
  currentTrick.current = 'none';
  trickProgress.current = 0;
  setTrickRotation({ x: 0, y: 0, z: 0 });
}
```

### 4. Add Visual Effects to Render (inside the main return)

Find this section (around line 429-447):
```tsx
<group ref={meshGroup}>
  <SkateboardModel wheelSpeed={speed} trickRotation={trickRotation} />

  {/* Character on skateboard */}
  {isActive && (
    <group position={[0, 0.12, 0]} rotation={[0, Math.PI / 2, 0]}>
      <CharacterModel ... />
    </group>
  )}
</group>
```

Add effects AFTER the closing `</group>` and BEFORE the closing `</RigidBody>`:

```tsx
<group ref={meshGroup}>
  <SkateboardModel wheelSpeed={speed} trickRotation={trickRotation} />
  {/* ... existing character ... */}
</group>

{/* ADD THESE EFFECTS */}
{isActive && (
  <>
    <SpeedLines
      speed={speed}
      position={[pos.x, pos.y, pos.z]}
      rotation={rotation.current}
    />

    <DustParticles
      position={[pos.x, pos.y, pos.z]}
      velocity={[vel.x, vel.y, vel.z]}
      isGrounded={isGrounded}
      isBraking={isBraking}
      justLanded={justLanded}
    />

    <SkateTrail
      position={[pos.x, pos.y, pos.z]}
      rotation={rotation.current}
      speed={speed}
      isGrounded={isGrounded}
    />

    <TrickPopup
      visible={showPopup}
      trickName={currentTrick}
      comboCount={comboCount}
      onComplete={resetCombo}
    />
  </>
)}
```

## Test It!

1. Start the dev server: `npm run dev`
2. Mount the skateboard
3. Try these actions:

- **Speed up** - Watch for speed lines behind you
- **Brake hard** - See dust particles trail
- **Jump (Space)** - Hear landing sound, see dust burst
- **Do tricks** - Jump + Shift for kickflip, see trick popup
- **Chain tricks** - Do multiple tricks within 2 seconds for combos

## Performance Check

Open Chrome DevTools → Performance tab → Record while skateboarding.

Expected overhead: ~0.5ms per frame (3% of 60fps budget)

If experiencing lag:
1. Reduce SPEEDLINES_COUNT to 15 in `skateEffects.tsx`
2. Comment out `<SkateTrail />` (most expensive)
3. Increase spawn rates (fewer particles)

## Customization

### Make Speed Lines More Dramatic
```tsx
// In skateEffects.tsx, line 20-25
SPEEDLINES_COUNT: 30,        // More lines
SPEEDLINES_MIN_SPEED: 6,     // Show earlier
SPEEDLINES_LENGTH: 3,        // Longer
```

### Change Trick Popup Color
```tsx
// In skateEffects.tsx, line 252
color={comboCount > 1 ? "#00ff00" : "#ffffff"}  // Green for combos
```

### Adjust Sound Volume
```tsx
// In audio.ts, each sound has gainNode.gain.setValueAtTime
// Lower the first number to reduce volume
gainNode.gain.setValueAtTime(0.08, now);  // Quieter (was 0.12)
```

## Troubleshooting

**Effects not showing?**
- Check browser console for errors
- Verify `isActive` is true when on skateboard
- Ensure position values are valid (not NaN)

**No sound?**
- Click on the page first (Web Audio requires user interaction)
- Check browser audio isn't muted
- Look for console errors

**Poor performance?**
- Disable SkateTrail first (comment out)
- Reduce particle pool sizes
- Check Chrome DevTools Performance tab

## Next Steps

Once working, consider adding:
- Grind detection (see integration example)
- Camera shake on landing
- Trick score system
- More trick types (manuals, grinds, etc.)

## Full Documentation

See `SKATEBOARD_EFFECTS_README.md` for complete API reference and advanced usage.
