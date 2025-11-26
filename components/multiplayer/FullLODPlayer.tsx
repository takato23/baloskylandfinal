/**
 * Full LOD Player Component
 * High-detail player rendering with animations
 * Lazy-loaded for better initial performance
 */

import React, { useRef, memo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Text, Billboard } from '@react-three/drei';
import { CharacterModel } from '../player/CharacterModel';
import { EmoteBubbleQueue } from './EmoteBubble';
import { externCharacter, type PooledPlayer } from '../../lib/multiplayer-optimized';
import type { AnimalType, AccessoryType, EmoteData } from '../../types';

// ============================================
// Constants
// ============================================

const NAME_TAG_HEIGHT = 2.2;
const NAME_TAG_SCALE = 0.5;

// ============================================
// Full LOD Player Component
// ============================================

interface FullLODPlayerProps {
  player: PooledPlayer;
}

const FullLODPlayer: React.FC<FullLODPlayerProps> = memo(({ player }) => {
  const groupRef = useRef<Group>(null);

  // Update position every frame using interpolated data
  useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.position.set(
      player.position[0],
      player.position[1],
      player.position[2]
    );
    groupRef.current.rotation.y = player.rotation;
  });

  // Extract character data from interned indices
  const character = externCharacter(
    player.characterType,
    player.skinIndex,
    player.shirtIndex,
    player.pantsIndex,
    player.accessoryIndex
  );

  // Extract flags
  const isMoving = (player.flags & 1) !== 0;
  const isDriving = (player.flags & 2) !== 0;
  const isSitting = (player.flags & 4) !== 0;

  // Convert emotes from player (if any stored externally)
  // For now, we'll use an empty array - emotes are handled separately
  const emotes: EmoteData[] = [];

  return (
    <group ref={groupRef}>
      {/* Character Model */}
      <Suspense fallback={
        <mesh position={[0, 0.8, 0]}>
          <capsuleGeometry args={[0.25, 1.1, 4, 8]} />
          <meshStandardMaterial color={character.skin} />
        </mesh>
      }>
        <group position={[0, 0.1, 0]}>
          <CharacterModel
            isMoving={isMoving && !isSitting}
            run={isMoving}
            isSitting={isSitting}
            isGrounded={true}
            skin={character.skin}
            shirt={character.shirt}
            pants={character.pants}
            type={character.type as AnimalType}
            accessory={character.accessory as AccessoryType}
          />
        </group>
      </Suspense>

      {/* Name Tag */}
      <Billboard
        position={[0, NAME_TAG_HEIGHT, 0]}
        follow
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <group scale={NAME_TAG_SCALE}>
          {/* Background */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[player.username.length * 0.25 + 0.5, 0.4]} />
            <meshBasicMaterial color="#000000" opacity={0.6} transparent />
          </mesh>
          {/* Name */}
          <Text
            fontSize={0.3}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {player.username}
          </Text>
        </group>
      </Billboard>

      {/* Vehicle indicator */}
      {isDriving && (
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.8, 0.1, 1.2]} />
          <meshStandardMaterial color="#5d4037" />
        </mesh>
      )}

      {/* Emote bubbles */}
      {emotes.length > 0 && (
        <EmoteBubbleQueue
          emotes={emotes}
          onEmoteComplete={() => {}}
        />
      )}
    </group>
  );
});

FullLODPlayer.displayName = 'FullLODPlayer';

export default FullLODPlayer;
