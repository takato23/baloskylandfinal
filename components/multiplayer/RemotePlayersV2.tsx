/**
 * Remote Players V2 Component
 * Optimized for 50-100+ concurrent players with LOD system
 * Features:
 * - Level of Detail (LOD) rendering based on distance
 * - Velocity-based position prediction
 * - Adaptive interpolation speed
 * - Culling by spatial grid zones
 */

import React, { useRef, memo, useMemo, useCallback, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils, Vector3, Color } from 'three';
import { Text, Billboard } from '@react-three/drei';
import { useRemotePlayersV2, RemotePlayerV2, useMultiplayerV2 } from '../../hooks/useMultiplayerV2';
import { CharacterModel } from '../player/CharacterModel';
import { EmoteBubbleQueue } from './EmoteBubble';
import { GRID_CONFIG } from '../../lib/spatial-grid';
import type { AnimalType, AccessoryType } from '../../types';

// ============================================
// Constants
// ============================================

const LOD_CONFIG = {
  FULL: {
    interpolationSpeed: 10,
    showNameTag: true,
    showAnimations: true,
    showEmotes: true,
    showAccessory: true,
    modelDetail: 'full',
  },
  MEDIUM: {
    interpolationSpeed: 8,
    showNameTag: true,
    showAnimations: true,
    showEmotes: false,
    showAccessory: true,
    modelDetail: 'medium',
  },
  LOW: {
    interpolationSpeed: 6,
    showNameTag: false,
    showAnimations: false,
    showEmotes: false,
    showAccessory: false,
    modelDetail: 'low',
  },
};

const NAME_TAG_HEIGHT = 2.2;
const NAME_TAG_SCALE = 0.5;
const PREDICTION_FACTOR = 0.1; // How much to predict ahead

// ============================================
// Simple Capsule (for LOW LOD)
// ============================================

interface SimpleCapsuleProps {
  color: string;
  height?: number;
}

const SimpleCapsule: React.FC<SimpleCapsuleProps> = memo(({ color, height = 1.6 }) => (
  <group>
    <mesh position={[0, height / 2, 0]}>
      <capsuleGeometry args={[0.25, height - 0.5, 4, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
    {/* Simple head indicator */}
    <mesh position={[0, height - 0.1, 0]}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  </group>
));

SimpleCapsule.displayName = 'SimpleCapsule';

// ============================================
// LOD Remote Player Component
// ============================================

interface RemotePlayerLODProps {
  player: RemotePlayerV2;
  localPosition: [number, number, number];
  onEmoteComplete: (id: string) => void;
}

const RemotePlayerLOD: React.FC<RemotePlayerLODProps> = memo(({ player, localPosition, onEmoteComplete }) => {
  const groupRef = useRef<Group>(null);
  const currentPosition = useRef(new Vector3(...player.position));
  const currentRotation = useRef(player.rotation);
  const lastUpdateTime = useRef(Date.now());

  // Get LOD configuration
  const lodConfig = useMemo(() => {
    switch (player.lodLevel) {
      case 'full': return LOD_CONFIG.FULL;
      case 'medium': return LOD_CONFIG.MEDIUM;
      case 'low': return LOD_CONFIG.LOW;
      default: return LOD_CONFIG.LOW;
    }
  }, [player.lodLevel]);

  // Calculate color from character skin
  const playerColor = useMemo(() => {
    try {
      return player.character.skin || '#e91e63';
    } catch {
      return '#e91e63';
    }
  }, [player.character.skin]);

  // Handle emote completion
  const handleEmoteComplete = useCallback((emoteId: string) => {
    onEmoteComplete(emoteId);
  }, [onEmoteComplete]);

  // Interpolate with velocity prediction
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const now = Date.now();
    const timeSinceUpdate = (now - player.lastSeen) / 1000;

    // Calculate target position with velocity prediction
    let targetX = player.targetPosition[0];
    let targetZ = player.targetPosition[2];

    if (player.velocity && player.isMoving && timeSinceUpdate < 0.5) {
      // Predict position based on velocity
      targetX += player.velocity[0] * timeSinceUpdate * PREDICTION_FACTOR;
      targetZ += player.velocity[2] * timeSinceUpdate * PREDICTION_FACTOR;
    }

    const targetPos = new Vector3(targetX, player.targetPosition[1], targetZ);

    // Adaptive interpolation speed
    const interpSpeed = lodConfig.interpolationSpeed * (player.isMoving ? 1 : 0.5);
    currentPosition.current.lerp(targetPos, delta * interpSpeed);
    groupRef.current.position.copy(currentPosition.current);

    // Rotation interpolation
    currentRotation.current = MathUtils.lerp(
      currentRotation.current,
      player.targetRotation,
      delta * interpSpeed
    );
    groupRef.current.rotation.y = currentRotation.current;

    lastUpdateTime.current = now;
  });

  // Don't render hidden LOD
  if (player.lodLevel === 'hidden') {
    return null;
  }

  return (
    <group ref={groupRef} position={player.position}>
      {/* Render based on LOD level */}
      {player.lodLevel === 'low' ? (
        // Simple capsule for distant players
        <SimpleCapsule color={playerColor} />
      ) : (
        // Full character model for near/medium players
        <Suspense fallback={<SimpleCapsule color={playerColor} />}>
          <group position={[0, 0.1, 0]}>
            <CharacterModel
              isMoving={lodConfig.showAnimations ? player.isMoving : false}
              run={lodConfig.showAnimations && player.isMoving}
              isSitting={player.isSitting}
              isGrounded={true}
              skin={player.character.skin}
              shirt={player.character.shirt}
              pants={player.character.pants}
              type={player.character.type as AnimalType}
              accessory={lodConfig.showAccessory ? player.character.accessory as AccessoryType : 'none'}
            />
          </group>
        </Suspense>
      )}

      {/* Name Tag - Only for full/medium LOD */}
      {lodConfig.showNameTag && (
        <Billboard position={[0, NAME_TAG_HEIGHT, 0]} follow lockX={false} lockY={false} lockZ={false}>
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
            {/* Distance indicator for medium LOD */}
            {player.lodLevel === 'medium' && (
              <Text
                fontSize={0.15}
                color="#aaaaaa"
                anchorX="center"
                anchorY="middle"
                position={[0, -0.25, 0]}
              >
                {Math.round(player.distance)}m
              </Text>
            )}
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

      {/* Emote bubbles - Only for full LOD */}
      {lodConfig.showEmotes && player.emotes && player.emotes.length > 0 && (
        <EmoteBubbleQueue
          emotes={player.emotes}
          onEmoteComplete={handleEmoteComplete}
        />
      )}

      {/* Debug: Zone indicator (optional) */}
      {/* <Text
        position={[0, 0.5, 0]}
        fontSize={0.15}
        color="#ffff00"
      >
        {`Z:${player.zone.x},${player.zone.z}`}
      </Text> */}
    </group>
  );
});

RemotePlayerLOD.displayName = 'RemotePlayerLOD';

// ============================================
// Remote Players Container V2
// ============================================

interface RemotePlayersV2Props {
  localPosition: [number, number, number];
}

export const RemotePlayersV2: React.FC<RemotePlayersV2Props> = memo(({ localPosition }) => {
  const players = useRemotePlayersV2();
  const { removeEmote } = useMultiplayerV2();

  // Handle emote completion
  const handleEmoteComplete = useCallback((emoteId: string) => {
    removeEmote(emoteId, false);
  }, [removeEmote]);

  // Group players by LOD for efficient rendering
  const { fullLOD, mediumLOD, lowLOD } = useMemo(() => {
    const full: RemotePlayerV2[] = [];
    const medium: RemotePlayerV2[] = [];
    const low: RemotePlayerV2[] = [];

    for (const player of players) {
      switch (player.lodLevel) {
        case 'full': full.push(player); break;
        case 'medium': medium.push(player); break;
        case 'low': low.push(player); break;
      }
    }

    return { fullLOD: full, mediumLOD: medium, lowLOD: low };
  }, [players]);

  return (
    <group name="remote-players">
      {/* Full LOD players (closest, most detail) */}
      {fullLOD.map(player => (
        <RemotePlayerLOD
          key={player.odIduserId}
          player={player}
          localPosition={localPosition}
          onEmoteComplete={handleEmoteComplete}
        />
      ))}

      {/* Medium LOD players */}
      {mediumLOD.map(player => (
        <RemotePlayerLOD
          key={player.odIduserId}
          player={player}
          localPosition={localPosition}
          onEmoteComplete={handleEmoteComplete}
        />
      ))}

      {/* Low LOD players (farthest, least detail) */}
      {lowLOD.map(player => (
        <RemotePlayerLOD
          key={player.odIduserId}
          player={player}
          localPosition={localPosition}
          onEmoteComplete={handleEmoteComplete}
        />
      ))}
    </group>
  );
});

RemotePlayersV2.displayName = 'RemotePlayersV2';

// ============================================
// Minimap with Player Density
// ============================================

interface MinimapPlayersV2Props {
  localPosition: [number, number, number];
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const MinimapPlayersV2: React.FC<MinimapPlayersV2Props> = memo(({
  localPosition,
  scale,
  offsetX,
  offsetY,
}) => {
  const players = useRemotePlayersV2();

  // Color players by LOD/distance
  const getPlayerColor = (lodLevel: string): string => {
    switch (lodLevel) {
      case 'full': return '#22c55e'; // Green - close
      case 'medium': return '#eab308'; // Yellow - medium
      case 'low': return '#ef4444'; // Red - far
      default: return '#6b7280'; // Gray - hidden
    }
  };

  return (
    <>
      {players.map(player => {
        const relX = (player.position[0] - localPosition[0]) * scale + offsetX;
        const relZ = (player.position[2] - localPosition[2]) * scale + offsetY;

        // Only show if within minimap bounds
        if (Math.abs(relX - offsetX) > 60 || Math.abs(relZ - offsetY) > 60) {
          return null;
        }

        const color = getPlayerColor(player.lodLevel);

        return (
          <div
            key={player.odIduserId}
            className="absolute rounded-full border border-white/50 transition-colors"
            style={{
              left: relX,
              top: relZ,
              transform: 'translate(-50%, -50%)',
              width: player.lodLevel === 'full' ? 8 : player.lodLevel === 'medium' ? 6 : 4,
              height: player.lodLevel === 'full' ? 8 : player.lodLevel === 'medium' ? 6 : 4,
              backgroundColor: color,
            }}
            title={`${player.username} (${Math.round(player.distance)}m)`}
          />
        );
      })}
    </>
  );
});

MinimapPlayersV2.displayName = 'MinimapPlayersV2';

// ============================================
// Player Count Indicator
// ============================================

export const PlayerCountIndicator: React.FC = memo(() => {
  const players = useRemotePlayersV2();

  const counts = useMemo(() => {
    let full = 0, medium = 0, low = 0;
    for (const p of players) {
      if (p.lodLevel === 'full') full++;
      else if (p.lodLevel === 'medium') medium++;
      else if (p.lodLevel === 'low') low++;
    }
    return { full, medium, low, total: players.length };
  }, [players]);

  return (
    <div className="flex items-center gap-2 text-xs text-white/80">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        {counts.full}
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-yellow-500" />
        {counts.medium}
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        {counts.low}
      </span>
      <span className="text-white/60">({counts.total})</span>
    </div>
  );
});

PlayerCountIndicator.displayName = 'PlayerCountIndicator';

export default RemotePlayersV2;
