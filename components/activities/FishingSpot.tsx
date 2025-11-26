/**
 * FishingSpot - Interactive fishing location component
 * Players can fish here when near and equipped with a rod
 */

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../../store';
import { useActivityStore } from '../../stores/activityStore';
import { FISH_DATA, getActiveFish } from '../../data/fish';
import { playSound } from '../../utils/audio';
import type { Fish, FishLocation } from '../../types/collectibles';

interface FishingSpotProps {
  position: [number, number, number];
  size?: [number, number];
  location: FishLocation;
}

export function FishingSpot({ position, size = [3, 3], location }: FishingSpotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const bobberRef = useRef<THREE.Mesh>(null);
  const [isPlayerNear, setIsPlayerNear] = useState(false);
  const [fishShadows, setFishShadows] = useState<Array<{ id: string; position: [number, number]; speed: number; angle: number }>>([]);

  const setInteractionLabel = useGameStore((s) => s.setInteractionLabel);
  const addCoin = useGameStore((s) => s.addCoin);

  const fishing = useActivityStore((s) => s.fishing);
  const startFishing = useActivityStore((s) => s.startFishing);
  const castLine = useActivityStore((s) => s.castLine);
  const catchFish = useActivityStore((s) => s.catchFish);
  const failCatch = useActivityStore((s) => s.failCatch);
  const stopFishing = useActivityStore((s) => s.stopFishing);
  const tools = useActivityStore((s) => s.tools);

  // Get currently active fish based on time
  const currentHour = new Date().getHours();
  const currentMonth = new Date().getMonth() + 1;
  const activeFish = useMemo(
    () => getActiveFish(currentHour, currentMonth).filter(f => f.location === location),
    [currentHour, currentMonth, location]
  );

  // Generate fish shadows swimming around
  useEffect(() => {
    const shadows = Array.from({ length: 3 }, (_, i) => ({
      id: `shadow_${i}`,
      position: [
        (Math.random() - 0.5) * size[0],
        (Math.random() - 0.5) * size[1],
      ] as [number, number],
      speed: 0.3 + Math.random() * 0.5,
      angle: Math.random() * Math.PI * 2,
    }));
    setFishShadows(shadows);
  }, [size]);

  // Animate water and fish shadows
  useFrame((state, delta) => {
    // Water ripple animation
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material.map) {
        material.map.offset.x += delta * 0.02;
        material.map.offset.y += delta * 0.01;
      }
    }

    // Bobber animation when fishing
    if (bobberRef.current && fishing.isActive && fishing.stage === 'waiting') {
      bobberRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }

    // Move fish shadows
    setFishShadows(prev => prev.map(shadow => {
      const newAngle = shadow.angle + (Math.random() - 0.5) * 0.1;
      const newX = shadow.position[0] + Math.cos(newAngle) * shadow.speed * delta;
      const newY = shadow.position[1] + Math.sin(newAngle) * shadow.speed * delta;

      // Keep within bounds
      const clampedX = Math.max(-size[0] / 2 + 0.3, Math.min(size[0] / 2 - 0.3, newX));
      const clampedY = Math.max(-size[1] / 2 + 0.3, Math.min(size[1] / 2 - 0.3, newY));

      return {
        ...shadow,
        position: [clampedX, clampedY],
        angle: newAngle,
      };
    }));
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
        playSound('coin'); // Use as bite sound

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

            // Calculate fish size (random variation)
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
    if (tools.equipped === 'fishing_rod' || tools.inventory.some(t => t.type === 'fishing_rod')) {
      setInteractionLabel('Press E to Fish');
    } else {
      setInteractionLabel('Need a Fishing Rod');
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

    if (fishing.isActive) {
      // If waiting, try to reel in
      if (fishing.stage === 'waiting') {
        // This triggers the catch check
        useActivityStore.setState({
          fishing: { ...fishing, stage: 'reeling' },
        });
      }
    } else {
      // Start fishing
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

  const waterColor = location === 'ocean' ? '#1e88e5' : location === 'river' ? '#42a5f5' : '#64b5f6';

  return (
    <group position={position}>
      {/* Water surface */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[size[0], size[1]]} />
        <meshStandardMaterial
          color={waterColor}
          transparent
          opacity={0.7}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>

      {/* Fish shadows */}
      {fishShadows.map((shadow, i) => (
        <mesh
          key={shadow.id}
          position={[shadow.position[0], 0.02, shadow.position[1]]}
          rotation={[-Math.PI / 2, 0, shadow.angle]}
          scale={[1, 0.5 + i * 0.05, 1]}
        >
          <circleGeometry args={[0.15 + i * 0.05, 8]} />
          <meshBasicMaterial color="#1a1a2e" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Bobber when fishing */}
      {fishing.isActive && fishing.castPosition && (
        <mesh
          ref={bobberRef}
          position={[
            (Math.random() - 0.5) * size[0] * 0.5,
            0.1,
            (Math.random() - 0.5) * size[1] * 0.5,
          ]}
        >
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color={fishing.stage === 'bite' ? '#ff0000' : '#ff6b6b'}
            emissive={fishing.stage === 'bite' ? '#ff0000' : '#000000'}
            emissiveIntensity={fishing.stage === 'bite' ? 0.5 : 0}
          />
        </mesh>
      )}

      {/* Interaction sensor */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[size[0] / 2 + 1, 1, size[1] / 2 + 1]}
          sensor
          onIntersectionEnter={handlePlayerEnter}
          onIntersectionExit={handlePlayerExit}
        />
      </RigidBody>

      {/* Ripple effects */}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh
          key={`ripple_${i}`}
          position={[
            (Math.random() - 0.5) * size[0] * 0.8,
            0.015,
            (Math.random() - 0.5) * size[1] * 0.8,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.1, 0.15, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export default FishingSpot;
