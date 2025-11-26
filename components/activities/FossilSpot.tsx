/**
 * FossilSpot - Diggable fossil location
 * Players can dig here with a shovel to find fossils
 */

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../../store';
import { useActivityStore } from '../../stores/activityStore';
import { FOSSIL_DATA } from '../../data/fossils';
import { playSound } from '../../utils/audio';

interface FossilSpotProps {
  position: [number, number, number];
  onDig?: () => void;
}

export function FossilSpot({ position, onDig }: FossilSpotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const starRef = useRef<THREE.Mesh>(null);
  const [isDug, setIsDug] = useState(false);
  const [isPlayerNear, setIsPlayerNear] = useState(false);
  const [isDigging, setIsDigging] = useState(false);
  const [digProgress, setDigProgress] = useState(0);

  const setInteractionLabel = useGameStore((s) => s.setInteractionLabel);
  const addCoin = useGameStore((s) => s.addCoin);
  const openDialogue = useGameStore((s) => s.openDialogue);

  const findFossil = useActivityStore((s) => s.findFossil);
  const tools = useActivityStore((s) => s.tools);
  const collection = useActivityStore((s) => s.collection);

  // Animate the star marker
  useFrame((state, delta) => {
    if (starRef.current && !isDug) {
      starRef.current.rotation.y += delta * 2;
      starRef.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }

    // Digging animation
    if (isDigging && meshRef.current) {
      setDigProgress(prev => {
        const newProgress = prev + delta * 50; // 2 seconds to dig
        if (newProgress >= 100) {
          completeDigging();
          return 100;
        }
        return newProgress;
      });

      // Shake effect while digging
      meshRef.current.position.x = position[0] + (Math.random() - 0.5) * 0.02;
      meshRef.current.position.z = position[2] + (Math.random() - 0.5) * 0.02;
    }
  });

  const completeDigging = () => {
    setIsDigging(false);
    setIsDug(true);

    // Select a random fossil weighted by rarity
    const notFoundYet = FOSSIL_DATA.filter(f => !collection.fossils.found.includes(f.id));
    const fossilPool = notFoundYet.length > 0 ? notFoundYet : FOSSIL_DATA;

    // Weight selection - prefer unfound fossils and rarer ones
    const randomIndex = Math.floor(Math.random() * fossilPool.length);
    const selectedFossil = fossilPool[randomIndex];

    findFossil(selectedFossil);
    addCoin(100); // Small bonus for finding

    // Show dialogue with fossil info
    openDialogue(
      `Found: ${selectedFossil.icon} ${selectedFossil.nameEs}!`,
      `${selectedFossil.funFactEs}\n\nValor: ${selectedFossil.price} monedas`
    );

    playSound('coin');
    onDig?.();
  };

  const handlePlayerEnter = () => {
    if (isDug) return;
    setIsPlayerNear(true);

    if (tools.equipped === 'shovel' || tools.inventory.some(t => t.type === 'shovel')) {
      setInteractionLabel('Press E to Dig');
    } else {
      setInteractionLabel('Need a Shovel');
    }
  };

  const handlePlayerExit = () => {
    setIsPlayerNear(false);
    setInteractionLabel(null);
    if (isDigging) {
      setIsDigging(false);
      setDigProgress(0);
    }
  };

  const startDigging = () => {
    if (!isPlayerNear || isDug) return;
    if (!tools.inventory.some(t => t.type === 'shovel')) return;

    setIsDigging(true);
    playSound('step');
  };

  // Listen for interact key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && isPlayerNear && !isDug) {
        startDigging();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter')) {
        // Stop digging if key released
        if (digProgress < 100) {
          setIsDigging(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlayerNear, isDug, digProgress]);

  if (isDug) {
    // Show the hole after digging
    return (
      <group position={position}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[0.4, 16]} />
          <meshStandardMaterial color="#3d2817" />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position}>
      {/* Ground crack pattern - indicates buried fossil */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.3, 6]} />
        <meshStandardMaterial
          color="#5d4037"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Star marker */}
      <mesh ref={starRef} position={[0, 0.3, 0]}>
        <octahedronGeometry args={[0.1]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Dig progress indicator */}
      {isDigging && (
        <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.25, 32, 1, 0, (digProgress / 100) * Math.PI * 2]} />
          <meshBasicMaterial color="#4caf50" />
        </mesh>
      )}

      {/* Interaction sensor */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[0.8, 0.5, 0.8]}
          sensor
          onIntersectionEnter={handlePlayerEnter}
          onIntersectionExit={handlePlayerExit}
        />
      </RigidBody>
    </group>
  );
}

export default FossilSpot;
