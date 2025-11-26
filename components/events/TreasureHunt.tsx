/**
 * Treasure Hunt Event
 * Golden chests spawn around the city - first to collect wins!
 */

import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CuboidCollider } from '@react-three/rapier';
import { Box, RoundedBox, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store';
import { playSound } from '../../utils/audio';
import { broadcastChestCollected } from '../../lib/events';
import type { Vector3 } from '../../types';
import type { EventState, TreasureChestData } from '../../lib/events';

// ============================================
// Treasure Chest Component
// ============================================

interface TreasureChestProps {
  data: TreasureChestData;
  eventId: string;
  onCollect: (chestId: string) => void;
}

const TreasureChest: React.FC<TreasureChestProps> = ({ data, eventId, onCollect }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [collected, setCollected] = useState(data.collected);
  const playerPosition = useGameStore((s) => s.playerPosition);
  const qualityLevel = useGameStore((s) => s.qualityLevel);

  // Rotation and bobbing animation
  useFrame((state, delta) => {
    if (!meshRef.current || collected) return;

    // Rotate
    meshRef.current.rotation.y += delta * 1.5;

    // Bob up and down
    const time = state.clock.elapsedTime;
    meshRef.current.position.y = data.position[1] + Math.sin(time * 2) * 0.2;

    // Scale pulse
    const scale = 1 + Math.sin(time * 3) * 0.1;
    meshRef.current.scale.setScalar(scale);
  });

  // Check for collection
  useEffect(() => {
    if (collected) return;

    const [px, py, pz] = playerPosition;
    const [cx, cy, cz] = data.position;
    const distance = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2 + (pz - cz) ** 2);

    if (distance < 1.5) {
      // Collect!
      setCollected(true);
      playSound('coin');
      onCollect(data.id);
      broadcastChestCollected(eventId, data.id, 'local_player'); // TODO: actual user ID

      // Add coins
      useGameStore.getState().addCoin(10);
    }
  }, [playerPosition, data, collected, eventId, onCollect]);

  if (collected) return null;

  const showParticles = qualityLevel !== 'low';

  return (
    <group ref={meshRef} position={data.position}>
      {/* Chest body */}
      <RoundedBox args={[0.6, 0.4, 0.5]} radius={0.05} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </RoundedBox>

      {/* Chest lid */}
      <RoundedBox args={[0.62, 0.15, 0.52]} radius={0.05} position={[0, 0.475, 0]}>
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </RoundedBox>

      {/* Lock */}
      <Sphere args={[0.08, 16, 16]} position={[0, 0.25, 0.26]}>
        <meshStandardMaterial color="#8B4513" metalness={0.5} roughness={0.5} />
      </Sphere>

      {/* Glow effect */}
      <pointLight color="#FFD700" intensity={2} distance={5} position={[0, 0.3, 0]} />

      {/* Sparkle particles */}
      {showParticles && (
        <>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 0.8;
            return (
              <Sphere
                key={i}
                args={[0.05, 8, 8]}
                position={[
                  Math.cos(angle + Date.now() * 0.001) * radius,
                  0.5 + Math.sin(Date.now() * 0.003 + i) * 0.3,
                  Math.sin(angle + Date.now() * 0.001) * radius,
                ]}
              >
                <meshBasicMaterial color="#FFD700" transparent opacity={0.6} />
              </Sphere>
            );
          })}
        </>
      )}

      {/* Collision sensor */}
      <RigidBody type="fixed" colliders={false} sensor>
        <CuboidCollider args={[0.4, 0.4, 0.4]} />
      </RigidBody>
    </group>
  );
};

// ============================================
// Treasure Hunt Event Component
// ============================================

interface TreasureHuntProps {
  event: EventState;
  onComplete: (score: number) => void;
}

export const TreasureHunt: React.FC<TreasureHuntProps> = ({ event, onComplete }) => {
  const [chests, setChests] = useState<TreasureChestData[]>([]);
  const [collectedCount, setCollectedCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Generate chests on mount
  useEffect(() => {
    const generateChests = (): TreasureChestData[] => {
      const chestCount = 15;
      const worldSize = 45; // Stay within city bounds
      const generatedChests: TreasureChestData[] = [];

      for (let i = 0; i < chestCount; i++) {
        // Random position within city
        const x = (Math.random() - 0.5) * worldSize;
        const z = (Math.random() - 0.5) * worldSize;
        const y = 0.5; // Spawn at ground level

        generatedChests.push({
          id: `chest_${i}`,
          position: [x, y, z],
          collected: false,
        });
      }

      return generatedChests;
    };

    setChests(generateChests());
  }, [event.id]);

  // Timer countdown
  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((event.endTime - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        onComplete(collectedCount);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [event.endTime, collectedCount, onComplete]);

  const handleCollect = (chestId: string) => {
    setChests((prev) =>
      prev.map((chest) =>
        chest.id === chestId ? { ...chest, collected: true, collectedBy: 'local_player' } : chest
      )
    );
    setCollectedCount((prev) => prev + 1);
  };

  return (
    <group>
      {chests.map((chest) => (
        <TreasureChest
          key={chest.id}
          data={chest}
          eventId={event.id}
          onCollect={handleCollect}
        />
      ))}
    </group>
  );
};
