/**
 * BugSpawn - Catchable bug component
 * Spawns bugs that players can catch with a net
 */

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../../store';
import { useActivityStore } from '../../stores/activityStore';
import { playSound } from '../../utils/audio';
import type { Bug } from '../../types/collectibles';

interface BugSpawnProps {
  position: [number, number, number];
  bug: Bug;
  onCatch?: () => void;
  onEscape?: () => void;
}

export function BugSpawn({ position, bug, onCatch, onEscape }: BugSpawnProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isPlayerNear, setIsPlayerNear] = useState(false);
  const [isScared, setIsScared] = useState(false);
  const [flightPath, setFlightPath] = useState<THREE.Vector3 | null>(null);

  const setInteractionLabel = useGameStore((s) => s.setInteractionLabel);
  const addCoin = useGameStore((s) => s.addCoin);

  const catchBug = useActivityStore((s) => s.catchBug);
  const tools = useActivityStore((s) => s.tools);

  // Bug movement patterns
  const movementRef = useRef({
    baseY: position[1],
    time: Math.random() * Math.PI * 2,
    wanderAngle: Math.random() * Math.PI * 2,
    wanderTarget: new THREE.Vector3(position[0], position[1], position[2]),
  });

  // Animate bug
  useFrame((state, delta) => {
    if (!meshRef.current || !isVisible) return;

    const mov = movementRef.current;
    mov.time += delta;

    if (isScared && flightPath) {
      // Flee animation
      meshRef.current.position.lerp(flightPath, delta * 5);
      meshRef.current.position.y += delta * 2;

      if (meshRef.current.position.distanceTo(flightPath) < 0.5) {
        setIsVisible(false);
        onEscape?.();
      }
    } else {
      // Normal movement based on bug speed
      const speed = bug.speed === 'stationary' ? 0
        : bug.speed === 'slow' ? 0.3
          : bug.speed === 'medium' ? 0.6
            : 1.2;

      if (bug.location === 'air') {
        // Flying pattern
        meshRef.current.position.y = mov.baseY + Math.sin(mov.time * 2) * 0.3;
        meshRef.current.position.x = position[0] + Math.sin(mov.time * 0.5) * 0.5;
        meshRef.current.position.z = position[2] + Math.cos(mov.time * 0.5) * 0.5;
      } else if (bug.location === 'flower') {
        // Hover around flower
        meshRef.current.position.y = mov.baseY + Math.sin(mov.time * 3) * 0.1;
        meshRef.current.rotation.y += delta * 0.5;
      } else if (bug.location === 'ground') {
        // Crawling pattern
        if (speed > 0) {
          mov.wanderAngle += (Math.random() - 0.5) * delta;
          meshRef.current.position.x += Math.cos(mov.wanderAngle) * speed * delta * 0.3;
          meshRef.current.position.z += Math.sin(mov.wanderAngle) * speed * delta * 0.3;
          meshRef.current.rotation.y = mov.wanderAngle;
        }
      } else if (bug.location === 'tree') {
        // Stick to tree, slight movement
        meshRef.current.position.y = mov.baseY + Math.sin(mov.time * 0.5) * 0.05;
      }

      // Wing flutter for flying bugs
      if (bug.location === 'air' || bug.location === 'flower') {
        const wingScale = 1 + Math.sin(mov.time * 20) * 0.1;
        meshRef.current.scale.setScalar(wingScale * 0.15);
      }
    }
  });

  // Handle player proximity - bugs may flee
  useEffect(() => {
    if (isPlayerNear && bug.speed !== 'stationary' && bug.speed !== 'slow') {
      // Fast bugs might flee when player gets close
      const fleeChance = bug.speed === 'fast' ? 0.3 : 0.1;
      if (Math.random() < fleeChance) {
        setIsScared(true);
        const escapeDirection = new THREE.Vector3(
          position[0] + (Math.random() - 0.5) * 10,
          position[1] + 3,
          position[2] + (Math.random() - 0.5) * 10
        );
        setFlightPath(escapeDirection);
        playSound('rustle');
      }
    }
  }, [isPlayerNear, bug.speed, position]);

  const handlePlayerEnter = () => {
    setIsPlayerNear(true);
    if (tools.equipped === 'net' || tools.inventory.some(t => t.type === 'net')) {
      setInteractionLabel(`Press E to Catch ${bug.name}`);
    } else {
      setInteractionLabel('Need a Net');
    }
  };

  const handlePlayerExit = () => {
    setIsPlayerNear(false);
    setInteractionLabel(null);
  };

  const handleCatch = () => {
    if (!isPlayerNear || !isVisible) return;
    if (!tools.inventory.some(t => t.type === 'net')) return;

    // Calculate catch success based on bug speed
    let successChance = bug.speed === 'stationary' ? 0.95
      : bug.speed === 'slow' ? 0.85
        : bug.speed === 'medium' ? 0.7
          : 0.5;

    // Rare/legendary bugs are harder
    if (bug.rarity === 'rare') successChance *= 0.8;
    if (bug.rarity === 'legendary') successChance *= 0.6;

    if (Math.random() < successChance) {
      // Successful catch!
      catchBug(bug);
      addCoin(bug.price);
      setIsVisible(false);
      playSound('coin');
      onCatch?.();
    } else {
      // Bug escapes
      setIsScared(true);
      const escapeDirection = new THREE.Vector3(
        position[0] + (Math.random() - 0.5) * 10,
        position[1] + 3,
        position[2] + (Math.random() - 0.5) * 10
      );
      setFlightPath(escapeDirection);
      playSound('rustle');
    }
  };

  // Listen for interact key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && isPlayerNear && isVisible) {
        handleCatch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayerNear, isVisible]);

  if (!isVisible) return null;

  // Bug visual based on type
  const getBugColor = () => {
    if (bug.icon.includes('🦋')) return '#9b59b6';
    if (bug.icon.includes('🐝')) return '#f1c40f';
    if (bug.icon.includes('🐞')) return '#e74c3c';
    if (bug.icon.includes('🪲')) return '#2c3e50';
    if (bug.icon.includes('🦗')) return '#27ae60';
    if (bug.icon.includes('🕷')) return '#1a1a1a';
    if (bug.icon.includes('🦂')) return '#8b4513';
    return '#34495e';
  };

  return (
    <group ref={meshRef} position={position}>
      {/* Bug body */}
      <mesh>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color={getBugColor()}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Wings for flying bugs */}
      {(bug.location === 'air' || bug.location === 'flower') && (
        <>
          <mesh position={[0.08, 0.02, 0]} rotation={[0, 0, 0.3]} scale={[1, 0.5, 1]}>
            <circleGeometry args={[0.08, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[-0.08, 0.02, 0]} rotation={[0, 0, -0.3]} scale={[1, 0.5, 1]}>
            <circleGeometry args={[0.08, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}

      {/* Glow for fireflies */}
      {bug.id === 'firefly' && (
        <pointLight
          color="#ffff00"
          intensity={0.5}
          distance={2}
        />
      )}

      {/* Interaction sensor */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[0.8, 0.8, 0.8]}
          sensor
          onIntersectionEnter={handlePlayerEnter}
          onIntersectionExit={handlePlayerExit}
        />
      </RigidBody>
    </group>
  );
}

export default BugSpawn;
