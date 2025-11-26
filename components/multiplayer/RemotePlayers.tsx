/**
 * Remote Players Component
 * Renders other players in the 3D world with smooth interpolation
 * Optimized for 100+ concurrent users
 */

import React, { useRef, memo, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils, Vector3 } from 'three';
import { Text, Billboard } from '@react-three/drei';
import { useRemotePlayers, RemotePlayer, useMultiplayer } from '../../hooks/useMultiplayer';
import { CharacterModel } from '../player/CharacterModel';
import { EmoteBubbleQueue } from './EmoteBubble';
import type { AnimalType, AccessoryType } from '../../types';

// ============================================
// Constants
// ============================================

const INTERPOLATION_SPEED = 8; // Higher = faster catch-up
const RENDER_DISTANCE = 100; // Don't render players beyond this
const NAME_TAG_HEIGHT = 2.2;
const NAME_TAG_SCALE = 0.5;

// ============================================
// Remote Player Component
// ============================================

interface RemotePlayerMeshProps {
  player: RemotePlayer;
  localPosition: [number, number, number];
  onEmoteComplete: (id: string) => void;
}

const RemotePlayerMesh: React.FC<RemotePlayerMeshProps> = memo(({ player, localPosition, onEmoteComplete }) => {
  const groupRef = useRef<Group>(null);
  const currentPosition = useRef(new Vector3(...player.position));
  const currentRotation = useRef(player.rotation);

  // Handle emote completion
  const handleEmoteComplete = useCallback((emoteId: string) => {
    onEmoteComplete(emoteId);
  }, [onEmoteComplete]);

  // Calculate distance for culling
  const distance = useMemo(() => {
    return Math.sqrt(
      Math.pow(player.position[0] - localPosition[0], 2) +
      Math.pow(player.position[2] - localPosition[2], 2)
    );
  }, [player.position, localPosition]);

  // Don't render if too far
  if (distance > RENDER_DISTANCE) {
    return null;
  }

  // Interpolate position and rotation
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smooth position interpolation
    const targetPos = new Vector3(...player.targetPosition);
    currentPosition.current.lerp(targetPos, delta * INTERPOLATION_SPEED);
    groupRef.current.position.copy(currentPosition.current);

    // Smooth rotation interpolation
    currentRotation.current = MathUtils.lerp(
      currentRotation.current,
      player.targetRotation,
      delta * INTERPOLATION_SPEED
    );
    groupRef.current.rotation.y = currentRotation.current;
  });

  // Determine LOD based on distance
  const isNear = distance < 30;

  return (
    <group ref={groupRef} position={player.position}>
      {/* Character Model */}
      <group position={[0, 0.1, 0]}>
        <CharacterModel
          isMoving={player.isMoving}
          run={player.isMoving && distance < 50} // Only animate running if close
          isSitting={player.isSitting}
          isGrounded={true}
          skin={player.character.skin}
          shirt={player.character.shirt}
          pants={player.character.pants}
          type={player.character.type as AnimalType}
          accessory={player.character.accessory as AccessoryType}
        />
      </group>

      {/* Name Tag - Only show when close enough */}
      {isNear && (
        <Billboard position={[0, NAME_TAG_HEIGHT, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
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
      )}

      {/* Vehicle indicator */}
      {player.isDriving && (
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.8, 0.1, 1.2]} />
          <meshStandardMaterial color="#5d4037" />
        </mesh>
      )}

      {/* Emote bubbles */}
      {player.emotes && player.emotes.length > 0 && (
        <EmoteBubbleQueue
          emotes={player.emotes}
          onEmoteComplete={handleEmoteComplete}
        />
      )}
    </group>
  );
});

RemotePlayerMesh.displayName = 'RemotePlayerMesh';

// ============================================
// Remote Players Container
// ============================================

interface RemotePlayersProps {
  localPosition: [number, number, number];
}

export const RemotePlayers: React.FC<RemotePlayersProps> = memo(({ localPosition }) => {
  const players = useRemotePlayers();
  const { removeEmote } = useMultiplayer();

  // Handle emote completion
  const handleEmoteComplete = useCallback((emoteId: string) => {
    removeEmote(emoteId, false);
  }, [removeEmote]);

  // Memoize player components
  const playerComponents = useMemo(() => {
    return players.map((player) => (
      <RemotePlayerMesh
        key={player.odIduserId}
        player={player}
        localPosition={localPosition}
        onEmoteComplete={handleEmoteComplete}
      />
    ));
  }, [players, localPosition, handleEmoteComplete]);

  return <>{playerComponents}</>;
});

RemotePlayers.displayName = 'RemotePlayers';

// ============================================
// Minimap Player Dots
// ============================================

interface MinimapPlayersProps {
  localPosition: [number, number, number];
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const MinimapPlayers: React.FC<MinimapPlayersProps> = memo(({
  localPosition,
  scale,
  offsetX,
  offsetY,
}) => {
  const players = useRemotePlayers();

  return (
    <>
      {players.map((player) => {
        const relX = (player.position[0] - localPosition[0]) * scale + offsetX;
        const relZ = (player.position[2] - localPosition[2]) * scale + offsetY;

        // Only show if within minimap bounds
        if (Math.abs(relX - offsetX) > 60 || Math.abs(relZ - offsetY) > 60) {
          return null;
        }

        return (
          <div
            key={player.odIduserId}
            className="absolute w-2 h-2 bg-green-400 rounded-full border border-white/50"
            style={{
              left: relX,
              top: relZ,
              transform: 'translate(-50%, -50%)',
            }}
            title={player.username}
          />
        );
      })}
    </>
  );
});

MinimapPlayers.displayName = 'MinimapPlayers';

export default RemotePlayers;
