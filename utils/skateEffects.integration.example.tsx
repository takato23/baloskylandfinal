/**
 * Example Integration for Skateboard Effects
 *
 * This file shows how to integrate the visual effects into Vehicle.tsx
 * Copy the relevant sections into your Skateboard component.
 */

import { SpeedLines, DustParticles, TrickPopup, SkateTrail, useComboSystem } from '../utils/skateEffects';
import { playSound } from '../utils/audio';

// ============================================
// 1. Add to Skateboard Component State
// ============================================

const ExampleSkateboardComponent = () => {
  // Existing state...
  const [speed, setSpeed] = useState(0);
  const [isGrounded, setIsGrounded] = useState(true);

  // Add these new states:
  const [justLanded, setJustLanded] = useState(false);
  const [isBraking, setIsBraking] = useState(false);
  const wasGrounded = useRef(true);

  // Add combo system
  const { currentTrick, comboCount, showPopup, registerTrick, resetCombo } = useComboSystem();

  // ============================================
  // 2. Update useFrame Logic
  // ============================================

  useFrame((state, delta) => {
    // ... existing physics code ...

    // Detect landing
    if (isGrounded && !wasGrounded.current) {
      setJustLanded(true);
      playSound('land');

      // Reset after a frame
      setTimeout(() => setJustLanded(false), 50);
    }
    wasGrounded.current = isGrounded;

    // Update braking state
    setIsBraking(wantBackward && grounded && velocityMagnitude.current > 3);

    // ... existing trick code ...

    // When trick completes successfully
    if (trickProgress.current >= 1 && currentTrick.current !== 'none') {
      const trickName = currentTrick.current === 'kickflip' ? 'Kickflip!' : 'Ollie!';

      // Register trick and play sound
      registerTrick(trickName);
      playSound('trick_success');

      // Combo bonus
      if (comboCount > 1) {
        playSound('combo');
      }

      currentTrick.current = 'none';
      trickProgress.current = 0;
      setTrickRotation({ x: 0, y: 0, z: 0 });
    }

    // ... rest of existing code ...
  });

  // ============================================
  // 3. Add Visual Effects to Render
  // ============================================

  return (
    <RigidBody ref={rigidBody} /* ... existing props ... */>
      {/* Existing skateboard model */}
      <group ref={meshGroup}>
        <SkateboardModel wheelSpeed={speed} trickRotation={trickRotation} />
        {/* ... existing character ... */}
      </group>

      {/* Add these visual effects */}
      {isActive && (
        <>
          {/* Speed lines when going fast */}
          <SpeedLines
            speed={speed}
            position={[pos.x, pos.y, pos.z]}
            rotation={rotation.current}
          />

          {/* Dust particles when braking or landing */}
          <DustParticles
            position={[pos.x, pos.y, pos.z]}
            velocity={[vel.x, vel.y, vel.z]}
            isGrounded={isGrounded}
            isBraking={isBraking}
            justLanded={justLanded}
          />

          {/* Optional: Wheel trail marks on ground */}
          <SkateTrail
            position={[pos.x, pos.y, pos.z]}
            rotation={rotation.current}
            speed={speed}
            isGrounded={isGrounded}
          />

          {/* Trick popup text */}
          <TrickPopup
            visible={showPopup}
            trickName={currentTrick}
            comboCount={comboCount}
            onComplete={resetCombo}
          />
        </>
      )}
    </RigidBody>
  );
};

// ============================================
// 4. Optional: Add Grind Detection
// ============================================

const detectGrindSurface = (position: Vector3, velocity: Vector3): boolean => {
  // Example: Detect if sliding along edges
  // This would need actual collision detection with rails/edges
  const horizontalSpeed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
  const isSliding = horizontalSpeed > 3 && Math.abs(velocity.y) < 0.5;

  // Add your own logic here to detect if on a grindable surface
  return isSliding;
};

// In useFrame:
const isGrinding = detectGrindSurface(new Vector3(pos.x, pos.y, pos.z), new Vector3(vel.x, vel.y, vel.z));

if (isGrinding) {
  // Play grind sound (you'd want to manage this so it doesn't repeat constantly)
  playSound('grind', [pos.x, pos.y, pos.z]);

  // Register as a trick
  registerTrick('50-50 Grind!');
}

// ============================================
// 5. Performance Optimization Tips
// ============================================

/**
 * The effects system is designed for performance:
 *
 * 1. Instanced Rendering: All particles use InstancedMesh for efficient rendering
 * 2. Object Pooling: Particles are reused, no new objects created in useFrame
 * 3. Conditional Rendering: Effects only render when conditions are met
 * 4. Culling: Inactive particles are automatically excluded from rendering
 * 5. Memory Management: Fixed pool sizes prevent memory growth
 *
 * Performance targets:
 * - SpeedLines: ~0.1ms per frame
 * - DustParticles: ~0.2ms per frame with active particles
 * - SkateTrail: ~0.15ms per frame
 * - TrickPopup: ~0.05ms per frame (UI only)
 *
 * Total overhead: <0.5ms per frame at 60fps
 */

// ============================================
// 6. Customization Examples
// ============================================

// Adjust constants in skateEffects.tsx:
const CUSTOM_EFFECTS = {
  // Make speed lines more dramatic
  SPEEDLINES_COUNT: 30,  // Default: 20
  SPEEDLINES_MIN_SPEED: 6,  // Default: 8 (lower = shows earlier)

  // More aggressive dust
  DUST_POOL_SIZE: 50,  // Default: 30
  DUST_SPAWN_RATE: 0.03,  // Default: 0.05 (lower = more frequent)

  // Longer combo window
  COMBO_WINDOW: 3.0,  // Default: 2.0 seconds
};

export { ExampleSkateboardComponent };
