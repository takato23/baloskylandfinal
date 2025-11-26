/**
 * Skate Race Event
 * Race through checkpoints on skateboard with ghost of best time
 */

import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Torus, Sphere, Cone, Box, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store';
import { playSound } from '../../utils/audio';
import { broadcastCheckpointPassed } from '../../lib/events';
import type { Vector3 } from '../../types';
import type { EventState, RaceCheckpointData } from '../../lib/events';

// ============================================
// Checkpoint Component
// ============================================

interface CheckpointProps {
  data: RaceCheckpointData;
  isPassed: boolean;
  isNext: boolean;
  eventId: string;
  onPass: (index: number, time: number) => void;
}

const Checkpoint: React.FC<CheckpointProps> = ({ data, isPassed, isNext, eventId, onPass }) => {
  const meshRef = useRef<THREE.Group>(null);
  const playerPosition = useGameStore((s) => s.playerPosition);
  const isDriving = useGameStore((s) => s.isDriving);
  const [hasPassedThrough, setHasPassedThrough] = useState(isPassed);
  const qualityLevel = useGameStore((s) => s.qualityLevel);

  // Animation
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Rotate slowly
    meshRef.current.rotation.y += delta * 0.5;

    // Pulse if next checkpoint
    if (isNext && !isPassed) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  // Check for pass-through
  useEffect(() => {
    if (hasPassedThrough || !isDriving || !isNext) return;

    const [px, py, pz] = playerPosition;
    const [cx, cy, cz] = data.position;
    const distance = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2 + (pz - cz) ** 2);

    if (distance < 2) {
      setHasPassedThrough(true);
      playSound('coin');
      onPass(data.index, Date.now());
      broadcastCheckpointPassed(eventId, 'local_player', data.index, Date.now());
    }
  }, [playerPosition, data, hasPassedThrough, isDriving, isNext, eventId, onPass]);

  const color = isPassed ? '#4ade80' : isNext ? '#fbbf24' : '#60a5fa';
  const showParticles = qualityLevel !== 'low' && !isPassed;

  return (
    <group ref={meshRef} position={data.position} rotation={[0, data.rotation, 0]}>
      {/* Ring */}
      <Torus args={[2, 0.15, 16, 32]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isNext ? 0.8 : 0.3}
          metalness={0.5}
          roughness={0.3}
        />
      </Torus>

      {/* Inner glow */}
      <Torus args={[1.5, 0.08, 8, 24]} position={[0, 0, 0]}>
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </Torus>

      {/* Number indicator */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="black"
      >
        {data.index + 1}
      </Text>

      {/* Light */}
      <pointLight color={color} intensity={isNext ? 4 : 2} distance={10} />

      {/* Particle trail for next checkpoint */}
      {showParticles && isNext && (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <Sphere
              key={i}
              args={[0.1, 8, 8]}
              position={[
                Math.cos((i / 6) * Math.PI * 2) * 2.5,
                Math.sin((i / 6) * Math.PI * 2 + Date.now() * 0.002) * 0.5,
                Math.sin((i / 6) * Math.PI * 2) * 2.5,
              ]}
            >
              <meshBasicMaterial color={color} transparent opacity={0.6} />
            </Sphere>
          ))}
        </>
      )}

      {/* Collision sensor */}
      <RigidBody type="fixed" colliders={false} sensor>
        <CuboidCollider args={[2, 2, 0.3]} />
      </RigidBody>
    </group>
  );
};

// ============================================
// Ghost Racer (Best Time)
// ============================================

interface GhostRacerProps {
  checkpoints: RaceCheckpointData[];
  visible: boolean;
}

const GhostRacer: React.FC<GhostRacerProps> = ({ checkpoints, visible }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useFrame((state, delta) => {
    if (!meshRef.current || !visible || checkpoints.length === 0) return;

    // Simple ghost movement between checkpoints
    const target = checkpoints[currentIndex % checkpoints.length];
    const current = meshRef.current.position;

    const dx = target.position[0] - current.x;
    const dz = target.position[2] - current.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 1) {
      setCurrentIndex((prev) => (prev + 1) % checkpoints.length);
    } else {
      const speed = 8;
      meshRef.current.position.x += (dx / distance) * speed * delta;
      meshRef.current.position.z += (dz / distance) * speed * delta;
      meshRef.current.rotation.y = Math.atan2(dx, dz);
    }
  });

  if (!visible) return null;

  return (
    <group ref={meshRef} position={[0, 0.5, 0]}>
      {/* Simple skateboard shape */}
      <Box args={[0.3, 0.1, 0.8]}>
        <meshStandardMaterial color="#9ca3af" transparent opacity={0.5} />
      </Box>
      {/* Ghost indicator */}
      <Sphere args={[0.2, 8, 8]} position={[0, 0.3, 0]}>
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.3} />
      </Sphere>
    </group>
  );
};

// ============================================
// Skate Race Event Component
// ============================================

interface SkateRaceProps {
  event: EventState;
  onComplete: (time: number, checkpoints: number) => void;
}

export const SkateRace: React.FC<SkateRaceProps> = ({ event, onComplete }) => {
  const [checkpoints, setCheckpoints] = useState<RaceCheckpointData[]>([]);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [lapTime, setLapTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [showGhost, setShowGhost] = useState(false);
  const isDriving = useGameStore((s) => s.isDriving);

  // Generate race track on mount
  useEffect(() => {
    const generateTrack = (): RaceCheckpointData[] => {
      const checkpointCount = 10;
      const worldRadius = 35;
      const track: RaceCheckpointData[] = [];

      for (let i = 0; i < checkpointCount; i++) {
        const angle = (i / checkpointCount) * Math.PI * 2;
        const radius = worldRadius * (0.7 + Math.random() * 0.3);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = 1.5;

        track.push({
          id: `checkpoint_${i}`,
          position: [x, y, z],
          rotation: angle + Math.PI / 2,
          index: i,
        });
      }

      return track;
    };

    const track = generateTrack();
    setCheckpoints(track);
    setStartTime(Date.now());

    // Load best time from localStorage
    const saved = localStorage.getItem(`race_best_time_${event.id}`);
    if (saved) {
      setBestTime(parseInt(saved, 10));
      setShowGhost(true);
    }
  }, [event.id]);

  // Timer update
  useEffect(() => {
    const interval = setInterval(() => {
      setLapTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  // Handle checkpoint pass
  const handleCheckpointPass = (index: number, time: number) => {
    if (index === currentCheckpoint) {
      setCurrentCheckpoint((prev) => prev + 1);

      // Completed lap?
      if (index === checkpoints.length - 1) {
        const finalTime = time - startTime;

        // Update best time
        if (!bestTime || finalTime < bestTime) {
          setBestTime(finalTime);
          localStorage.setItem(`race_best_time_${event.id}`, finalTime.toString());
          setShowGhost(true);
        }

        onComplete(finalTime, checkpoints.length);
      }
    }
  };

  // Auto-enter skateboard mode
  useEffect(() => {
    if (!isDriving) {
      useGameStore.getState().setDriving(true, 'skateboard');
    }
  }, [isDriving]);

  return (
    <group>
      {/* Start/Finish line */}
      <group position={[0, 0.1, 0]}>
        <Box args={[8, 0.05, 0.5]}>
          <meshStandardMaterial color="white" />
        </Box>
        <Box args={[1, 0.05, 0.5]} position={[-3, 0, 0]}>
          <meshStandardMaterial color="black" />
        </Box>
        <Box args={[1, 0.05, 0.5]} position={[-1, 0, 0]}>
          <meshStandardMaterial color="black" />
        </Box>
        <Box args={[1, 0.05, 0.5]} position={[1, 0, 0]}>
          <meshStandardMaterial color="black" />
        </Box>
        <Box args={[1, 0.05, 0.5]} position={[3, 0, 0]}>
          <meshStandardMaterial color="black" />
        </Box>
        <Text
          position={[0, 2, 0]}
          fontSize={1}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="black"
        >
          START / FINISH
        </Text>
      </group>

      {/* Checkpoints */}
      {checkpoints.map((checkpoint) => (
        <Checkpoint
          key={checkpoint.id}
          data={checkpoint}
          isPassed={checkpoint.index < currentCheckpoint}
          isNext={checkpoint.index === currentCheckpoint}
          eventId={event.id}
          onPass={handleCheckpointPass}
        />
      ))}

      {/* Ghost racer */}
      <GhostRacer checkpoints={checkpoints} visible={showGhost} />
    </group>
  );
};
