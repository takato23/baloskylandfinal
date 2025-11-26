/**
 * FishingPond - A dedicated fishing area with visible water
 * A single peaceful pond where players can fish
 */

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../../store';
import { useActivityStore } from '../../stores/activityStore';
import { FISH_DATA, getActiveFish } from '../../data/fish';
import { playSound } from '../../utils/audio';
import type { Fish } from '../../types/collectibles';

interface FishingPondProps {
  position: [number, number, number];
  size?: [number, number]; // width, depth
}

export function FishingPond({ position, size = [8, 6] }: FishingPondProps) {
  const waterRef = useRef<THREE.Mesh>(null);
  const [isPlayerNear, setIsPlayerNear] = useState(false);
  const [fishShadows, setFishShadows] = useState<Array<{
    id: string;
    position: [number, number];
    speed: number;
    angle: number;
    size: number;
  }>>([]);
  const [ripples, setRipples] = useState<Array<{
    id: string;
    position: [number, number];
    scale: number;
    opacity: number;
  }>>([]);

  const setInteractionLabel = useGameStore((s) => s.setInteractionLabel);
  const addCoin = useGameStore((s) => s.addCoin);

  const fishing = useActivityStore((s) => s.fishing);
  const startFishing = useActivityStore((s) => s.startFishing);
  const castLine = useActivityStore((s) => s.castLine);
  const catchFish = useActivityStore((s) => s.catchFish);
  const failCatch = useActivityStore((s) => s.failCatch);
  const stopFishing = useActivityStore((s) => s.stopFishing);
  const tools = useActivityStore((s) => s.tools);

  // Get currently active fish for pond location
  const currentHour = new Date().getHours();
  const currentMonth = new Date().getMonth() + 1;
  const activeFish = useMemo(
    () => getActiveFish(currentHour, currentMonth).filter(f => f.location === 'pond' || f.location === 'river'),
    [currentHour, currentMonth]
  );

  // Generate fish shadows swimming around
  useEffect(() => {
    const shadows = Array.from({ length: 5 }, (_, i) => ({
      id: `shadow_${i}`,
      position: [
        (Math.random() - 0.5) * (size[0] - 1),
        (Math.random() - 0.5) * (size[1] - 1),
      ] as [number, number],
      speed: 0.2 + Math.random() * 0.4,
      angle: Math.random() * Math.PI * 2,
      size: 0.15 + Math.random() * 0.15,
    }));
    setFishShadows(shadows);
  }, [size]);

  // Add random ripples
  useEffect(() => {
    const addRipple = () => {
      const newRipple = {
        id: `ripple_${Date.now()}`,
        position: [
          (Math.random() - 0.5) * (size[0] - 1),
          (Math.random() - 0.5) * (size[1] - 1),
        ] as [number, number],
        scale: 0.1,
        opacity: 0.6,
      };
      setRipples(prev => [...prev.slice(-4), newRipple]);
    };

    const interval = setInterval(addRipple, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [size]);

  // Animate water and fish
  useFrame((state, delta) => {
    // Water wave animation
    if (waterRef.current) {
      const material = waterRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.1 + Math.sin(state.clock.elapsedTime) * 0.05;
    }

    // Move fish shadows
    setFishShadows(prev => prev.map(shadow => {
      const newAngle = shadow.angle + (Math.random() - 0.5) * 0.08;
      const newX = shadow.position[0] + Math.cos(newAngle) * shadow.speed * delta;
      const newY = shadow.position[1] + Math.sin(newAngle) * shadow.speed * delta;

      // Keep within bounds
      const margin = 0.5;
      const clampedX = Math.max(-size[0] / 2 + margin, Math.min(size[0] / 2 - margin, newX));
      const clampedY = Math.max(-size[1] / 2 + margin, Math.min(size[1] / 2 - margin, newY));

      // Reverse direction if hitting boundary
      let finalAngle = newAngle;
      if (clampedX !== newX || clampedY !== newY) {
        finalAngle = newAngle + Math.PI;
      }

      return {
        ...shadow,
        position: [clampedX, clampedY] as [number, number],
        angle: finalAngle,
      };
    }));

    // Animate ripples
    setRipples(prev => prev
      .map(ripple => ({
        ...ripple,
        scale: ripple.scale + delta * 0.5,
        opacity: Math.max(0, ripple.opacity - delta * 0.3),
      }))
      .filter(ripple => ripple.opacity > 0)
    );
  });

  // Handle fishing logic
  useEffect(() => {
    if (!fishing.isActive || fishing.stage !== 'waiting') return;

    // Random time for fish to bite (3-10 seconds)
    const biteTime = 3000 + Math.random() * 7000;
    const biteTimeout = setTimeout(() => {
      if (activeFish.length > 0) {
        // Select a random fish weighted by rarity
        const weights = activeFish.map(f => {
          switch (f.rarity) {
            case 'common': return 60;
            case 'uncommon': return 25;
            case 'rare': return 12;
            case 'legendary': return 3;
            default: return 60;
          }
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        let selectedFish: Fish = activeFish[0];

        for (let i = 0; i < activeFish.length; i++) {
          random -= weights[i];
          if (random <= 0) {
            selectedFish = activeFish[i];
            break;
          }
        }

        // Fish is biting!
        playSound('coin');

        // Player has 2 seconds to reel in
        const missTimeout = setTimeout(() => {
          if (useActivityStore.getState().fishing.stage === 'waiting') {
            failCatch();
            playSound('rustle');
          }
        }, 2000);

        // Set up successful catch if player reels in time
        const checkReel = setInterval(() => {
          const currentState = useActivityStore.getState().fishing;
          if (currentState.stage === 'reeling') {
            clearInterval(checkReel);
            clearTimeout(missTimeout);

            const baseSize = selectedFish.shadowSize * 10;
            const sizeVariation = baseSize * 0.3;
            const actualSize = baseSize + (Math.random() - 0.5) * sizeVariation * 2;

            catchFish(selectedFish, Math.round(actualSize));
            addCoin(selectedFish.price);
            playSound('coin');
          } else if (currentState.stage === 'escaped' || !currentState.isActive) {
            clearInterval(checkReel);
            clearTimeout(missTimeout);
          }
        }, 100);
      }
    }, biteTime);

    return () => clearTimeout(biteTimeout);
  }, [fishing.isActive, fishing.stage, activeFish, catchFish, failCatch, addCoin]);

  const handlePlayerEnter = () => {
    setIsPlayerNear(true);
    const hasFishingRod = tools.equipped === 'fishing_rod' ||
      tools.inventory.some(t => t.type === 'fishing_rod');

    if (hasFishingRod) {
      setInteractionLabel('Presiona E para Pescar');
    } else {
      setInteractionLabel('Laguna de Pesca');
    }
  };

  const handlePlayerExit = () => {
    setIsPlayerNear(false);
    setInteractionLabel(null);
    if (fishing.isActive) {
      stopFishing();
    }
  };

  const handleInteract = () => {
    if (!isPlayerNear) return;

    const hasFishingRod = tools.equipped === 'fishing_rod' ||
      tools.inventory.some(t => t.type === 'fishing_rod');

    if (!hasFishingRod) {
      // Can still fish without rod for demo purposes
    }

    if (fishing.isActive) {
      if (fishing.stage === 'waiting') {
        useActivityStore.setState({
          fishing: { ...fishing, stage: 'reeling' },
        });
      }
    } else {
      startFishing(position);
      setTimeout(() => castLine(), 500);
      playSound('step');
    }
  };

  // Listen for interact key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && isPlayerNear) {
        handleInteract();
      }
      if (e.key === 'Escape' && fishing.isActive) {
        stopFishing();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayerNear, fishing.isActive, fishing.stage]);

  return (
    <group position={position}>
      {/* Pond border/edge - rocky stones around */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.max(size[0], size[1]) / 2, Math.max(size[0], size[1]) / 2 + 0.8, 32]} />
        <meshStandardMaterial color="#6b7280" roughness={0.9} />
      </mesh>

      {/* Decorative rocks around the pond */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = Math.max(size[0], size[1]) / 2 + 0.4;
        const rockSize = 0.2 + Math.random() * 0.3;
        return (
          <mesh
            key={`rock_${i}`}
            position={[
              Math.cos(angle) * radius,
              rockSize / 2,
              Math.sin(angle) * radius,
            ]}
            rotation={[Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5]}
          >
            <dodecahedronGeometry args={[rockSize, 0]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#9ca3af' : '#6b7280'}
              flatShading
              roughness={0.9}
            />
          </mesh>
        );
      })}

      {/* Water depression/hole */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[Math.max(size[0], size[1]) / 2, 32]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>

      {/* Main water surface */}
      <mesh
        ref={waterRef}
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[Math.max(size[0], size[1]) / 2 - 0.1, 32]} />
        <meshStandardMaterial
          color="#3b82f6"
          transparent
          opacity={0.75}
          roughness={0.1}
          metalness={0.3}
          emissive="#1e40af"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Water surface shine layer */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[Math.max(size[0], size[1]) / 2 - 0.2, 32]} />
        <meshStandardMaterial
          color="#60a5fa"
          transparent
          opacity={0.3}
          roughness={0}
          metalness={0.5}
        />
      </mesh>

      {/* Fish shadows swimming */}
      {fishShadows.map((shadow) => (
        <mesh
          key={shadow.id}
          position={[shadow.position[0], 0.01, shadow.position[1]]}
          rotation={[-Math.PI / 2, 0, shadow.angle + Math.PI / 2]}
        >
          <capsuleGeometry args={[shadow.size * 0.4, shadow.size, 4, 8]} />
          <meshBasicMaterial color="#1e3a5f" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Animated ripples */}
      {ripples.map((ripple) => (
        <mesh
          key={ripple.id}
          position={[ripple.position[0], 0.04, ripple.position[1]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[ripple.scale * 0.8, ripple.scale, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={ripple.opacity} />
        </mesh>
      ))}

      {/* Lily pads */}
      {[
        { x: -1.5, z: -1.2, rot: 0.3 },
        { x: 2, z: 0.8, rot: 1.2 },
        { x: -0.5, z: 2, rot: 2.5 },
      ].map((lily, i) => (
        <group key={`lily_${i}`} position={[lily.x, 0.04, lily.z]} rotation={[0, lily.rot, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.35, 16]} />
            <meshStandardMaterial color="#22c55e" side={THREE.DoubleSide} />
          </mesh>
          {/* Lily flower */}
          {i === 1 && (
            <mesh position={[0, 0.05, 0]}>
              <coneGeometry args={[0.1, 0.15, 6]} />
              <meshStandardMaterial color="#fbbf24" />
            </mesh>
          )}
        </group>
      ))}

      {/* Cattails/reeds on edges */}
      {[
        { x: -3.5, z: 0 },
        { x: 3.2, z: 1 },
        { x: 0, z: -3 },
      ].map((reed, i) => (
        <group key={`reed_${i}`} position={[reed.x, 0, reed.z]}>
          {/* Stem */}
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 1.2, 6]} />
            <meshStandardMaterial color="#4ade80" />
          </mesh>
          {/* Cattail top */}
          <mesh position={[0, 1.1, 0]}>
            <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        </group>
      ))}

      {/* Wooden dock/pier */}
      <group position={[size[0] / 2 + 0.5, 0.15, 0]}>
        {/* Main platform */}
        <mesh position={[0.8, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 0.15, 1.5]} />
          <meshStandardMaterial color="#92400e" roughness={0.8} />
        </mesh>
        {/* Plank lines */}
        {[-0.5, 0, 0.5].map((z, i) => (
          <mesh key={`plank_${i}`} position={[0.8, 0.08, z]}>
            <boxGeometry args={[1.9, 0.02, 0.02]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        ))}
        {/* Support posts */}
        <mesh position={[0.2, -0.15, 0.5]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.5, 8]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[0.2, -0.15, -0.5]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.5, 8]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[1.6, -0.15, 0.5]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.5, 8]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[1.6, -0.15, -0.5]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.5, 8]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      </group>

      {/* Bobber when fishing */}
      {fishing.isActive && (
        <mesh
          position={[
            (Math.random() - 0.5) * 2,
            0.1 + Math.sin(Date.now() / 300) * 0.03,
            (Math.random() - 0.5) * 2,
          ]}
        >
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color={fishing.stage === 'bite' ? '#ef4444' : '#f87171'}
            emissive={fishing.stage === 'bite' ? '#ef4444' : '#000000'}
            emissiveIntensity={fishing.stage === 'bite' ? 0.5 : 0}
          />
        </mesh>
      )}

      {/* Sign post */}
      <group position={[-size[0] / 2 - 1, 0, -size[1] / 2]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 1.2, 8]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[0, 1.1, 0.1]} castShadow>
          <boxGeometry args={[0.8, 0.4, 0.05]} />
          <meshStandardMaterial color="#fef3c7" />
        </mesh>
      </group>

      {/* Interaction sensor */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[size[0] / 2 + 2, 2, size[1] / 2 + 2]}
          sensor
          position={[0, 1, 0]}
          onIntersectionEnter={({ other }) => {
            if (other.rigidBodyObject?.name === 'player') {
              handlePlayerEnter();
            }
          }}
          onIntersectionExit={({ other }) => {
            if (other.rigidBodyObject?.name === 'player') {
              handlePlayerExit();
            }
          }}
        />
      </RigidBody>
    </group>
  );
}

export default FishingPond;
