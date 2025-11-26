/**
 * Instanced Players V3 Component
 * Ultra-optimized rendering for 100+ concurrent players
 * Features:
 * - InstancedMesh for LOD_LOW players (single draw call for all distant players)
 * - Object pooling with pre-allocated components
 * - RAF-based interpolation outside React render cycle
 * - Frustum culling at the instance level
 * - Minimal React re-renders through external state
 */

import React, { useRef, useMemo, useEffect, memo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  InstancedMesh,
  Object3D,
  Matrix4,
  Color,
  CapsuleGeometry,
  MeshStandardMaterial,
  Vector3,
  Frustum,
  Box3,
} from 'three';
import { Text, Billboard } from '@react-three/drei';
import {
  getActivePlayers,
  getVisiblePlayersSorted,
  updatePlayerDistancesAndLOD,
  setLocalPosition,
  invalidateVisibleCache,
  startInterpolation,
  stopInterpolation,
  addStateListener,
  removeStateListener,
  notifyStateChange,
  externCharacter,
  type PooledPlayer,
} from '../../lib/multiplayer-optimized';
import { useGameStore } from '../../store';

// ============================================
// Constants
// ============================================

const MAX_INSTANCES = 100;
const CAPSULE_RADIUS = 0.25;
const CAPSULE_HEIGHT = 1.6;
const NAME_TAG_HEIGHT = 2.2;

// LOD thresholds
const LOD_FULL = 0;
const LOD_MEDIUM = 1;
const LOD_LOW = 2;
const LOD_HIDDEN = 3;

// Colors for instanced capsules (indexed by character type)
const CAPSULE_COLORS = [
  '#f5d0c5', '#d4a574', '#8b5a2b', '#ffd700',
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
];

// ============================================
// Shared Geometry and Materials
// ============================================

const sharedCapsuleGeometry = new CapsuleGeometry(CAPSULE_RADIUS, CAPSULE_HEIGHT - CAPSULE_RADIUS * 2, 4, 8);
const sharedCapsuleMaterial = new MeshStandardMaterial({ color: '#e91e63' });

// Pre-allocated transformation objects
const tempObject = new Object3D();
const tempMatrix = new Matrix4();
const tempColor = new Color();
const tempVector = new Vector3();

// ============================================
// Frustum Culling Helper
// ============================================

const playerBoundingBox = new Box3();
const frustum = new Frustum();

const isInFrustum = (x: number, y: number, z: number, camera: THREE.Camera): boolean => {
  // Update frustum from camera
  frustum.setFromProjectionMatrix(
    tempMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  );

  // Create bounding box for player
  playerBoundingBox.setFromCenterAndSize(
    tempVector.set(x, y + CAPSULE_HEIGHT / 2, z),
    tempVector.set(1, CAPSULE_HEIGHT, 1)
  );

  return frustum.intersectsBox(playerBoundingBox);
};

// ============================================
// Instanced Low-LOD Players
// ============================================

interface InstancedLowLODPlayersProps {
  players: PooledPlayer[];
}

const InstancedLowLODPlayers = memo<InstancedLowLODPlayersProps>(({ players }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const { camera } = useThree();

  // Update instances every frame
  useFrame(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    let visibleCount = 0;

    for (let i = 0; i < players.length && visibleCount < MAX_INSTANCES; i++) {
      const player = players[i];

      // Skip if not low LOD
      if (player.lodLevel !== LOD_LOW) continue;

      // Frustum culling
      if (!isInFrustum(player.position[0], player.position[1], player.position[2], camera)) {
        continue;
      }

      // Set position and rotation
      tempObject.position.set(
        player.position[0],
        player.position[1] + CAPSULE_HEIGHT / 2,
        player.position[2]
      );
      tempObject.rotation.y = player.rotation;
      tempObject.updateMatrix();

      mesh.setMatrixAt(visibleCount, tempObject.matrix);

      // Set color based on character skin
      tempColor.set(CAPSULE_COLORS[player.skinIndex] || CAPSULE_COLORS[0]);
      mesh.setColorAt(visibleCount, tempColor);

      visibleCount++;
    }

    mesh.count = visibleCount;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[sharedCapsuleGeometry, sharedCapsuleMaterial, MAX_INSTANCES]}
      frustumCulled={false}
    >
      <capsuleGeometry args={[CAPSULE_RADIUS, CAPSULE_HEIGHT - CAPSULE_RADIUS * 2, 4, 8]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
});

InstancedLowLODPlayers.displayName = 'InstancedLowLODPlayers';

// ============================================
// Medium LOD Player (simplified model + name tag)
// ============================================

interface MediumLODPlayerProps {
  player: PooledPlayer;
}

const MediumLODPlayer = memo<MediumLODPlayerProps>(({ player }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Update position every frame (using RAF interpolation data)
  useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.position.set(
      player.position[0],
      player.position[1],
      player.position[2]
    );
    groupRef.current.rotation.y = player.rotation;
  });

  const character = externCharacter(
    player.characterType,
    player.skinIndex,
    player.shirtIndex,
    player.pantsIndex,
    player.accessoryIndex
  );

  return (
    <group ref={groupRef}>
      {/* Simplified capsule */}
      <mesh position={[0, CAPSULE_HEIGHT / 2, 0]}>
        <capsuleGeometry args={[CAPSULE_RADIUS, CAPSULE_HEIGHT - CAPSULE_RADIUS * 2, 4, 8]} />
        <meshStandardMaterial color={character.skin} />
      </mesh>

      {/* Head indicator */}
      <mesh position={[0, CAPSULE_HEIGHT - 0.1, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={character.skin} />
      </mesh>

      {/* Name tag */}
      <Billboard position={[0, NAME_TAG_HEIGHT, 0]}>
        <group scale={0.4}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[player.username.length * 0.2 + 0.4, 0.35]} />
            <meshBasicMaterial color="#000000" opacity={0.5} transparent />
          </mesh>
          <Text
            fontSize={0.25}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {player.username}
          </Text>
          {/* Distance indicator */}
          <Text
            fontSize={0.15}
            color="#aaaaaa"
            anchorX="center"
            anchorY="middle"
            position={[0, -0.22, 0]}
          >
            {Math.round(player.distance)}m
          </Text>
        </group>
      </Billboard>
    </group>
  );
});

MediumLODPlayer.displayName = 'MediumLODPlayer';

// ============================================
// Full LOD Player (full model with animations)
// Lazy loaded for better initial performance
// ============================================

const FullLODPlayer = React.lazy(() => import('./FullLODPlayer'));

interface FullLODPlayerWrapperProps {
  player: PooledPlayer;
}

const FullLODPlayerWrapper = memo<FullLODPlayerWrapperProps>(({ player }) => {
  return (
    <React.Suspense fallback={<MediumLODPlayer player={player} />}>
      <FullLODPlayer player={player} />
    </React.Suspense>
  );
});

FullLODPlayerWrapper.displayName = 'FullLODPlayerWrapper';

// ============================================
// Main Instanced Players Container
// ============================================

export const InstancedPlayersV3: React.FC = () => {
  const playerPosition = useGameStore(s => s.playerPosition);
  const [, forceUpdate] = React.useState({});

  // Player arrays by LOD level
  const playersRef = useRef<{
    full: PooledPlayer[];
    medium: PooledPlayer[];
    low: PooledPlayer[];
  }>({ full: [], medium: [], low: [] });

  // Start interpolation engine on mount
  useEffect(() => {
    startInterpolation();
    return () => stopInterpolation();
  }, []);

  // Subscribe to state changes (debounced)
  useEffect(() => {
    const handleStateChange = () => {
      forceUpdate({});
    };

    addStateListener(handleStateChange);
    return () => removeStateListener(handleStateChange);
  }, []);

  // Update local position for distance calculations
  useEffect(() => {
    const pos = playerPosition as [number, number, number];
    setLocalPosition(pos[0], pos[1], pos[2]);
  }, [playerPosition]);

  // Update player lists (this runs on state change)
  useFrame(() => {
    const pos = playerPosition as [number, number, number];
    setLocalPosition(pos[0], pos[1], pos[2]);
    updatePlayerDistancesAndLOD();
    invalidateVisibleCache();

    const visible = getVisiblePlayersSorted();

    // Categorize by LOD
    playersRef.current.full = [];
    playersRef.current.medium = [];
    playersRef.current.low = [];

    for (const player of visible) {
      switch (player.lodLevel) {
        case LOD_FULL:
          playersRef.current.full.push(player);
          break;
        case LOD_MEDIUM:
          playersRef.current.medium.push(player);
          break;
        case LOD_LOW:
          playersRef.current.low.push(player);
          break;
      }
    }
  });

  const { full, medium, low } = playersRef.current;

  return (
    <group name="instanced-players-v3">
      {/* Low LOD - Instanced rendering (single draw call) */}
      <InstancedLowLODPlayers players={low} />

      {/* Medium LOD - Simplified individual models */}
      {medium.map(player => (
        <MediumLODPlayer key={player.id} player={player} />
      ))}

      {/* Full LOD - Full models with animations (lazy loaded) */}
      {full.map(player => (
        <FullLODPlayerWrapper key={player.id} player={player} />
      ))}
    </group>
  );
};

// ============================================
// Performance Monitor Component
// ============================================

interface PerformanceMonitorProps {
  show?: boolean;
}

export const InstancedPlayersPerformanceMonitor: React.FC<PerformanceMonitorProps> = memo(({ show = false }) => {
  const [stats, setStats] = React.useState({
    activeCount: 0,
    visibleCount: 0,
    fullCount: 0,
    mediumCount: 0,
    lowCount: 0,
    hiddenCount: 0,
  });

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      const players = getActivePlayers();
      const lodCounts = [0, 0, 0, 0];

      for (const player of players) {
        lodCounts[player.lodLevel]++;
      }

      setStats({
        activeCount: players.length,
        visibleCount: lodCounts[0] + lodCounts[1] + lodCounts[2],
        fullCount: lodCounts[0],
        mediumCount: lodCounts[1],
        lowCount: lodCounts[2],
        hiddenCount: lodCounts[3],
      });
    }, 500);

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded font-mono z-50">
      <div className="font-bold mb-1">Players V3</div>
      <div>Active: {stats.activeCount}</div>
      <div>Visible: {stats.visibleCount}</div>
      <div className="flex gap-2 mt-1">
        <span className="text-green-400">F:{stats.fullCount}</span>
        <span className="text-yellow-400">M:{stats.mediumCount}</span>
        <span className="text-red-400">L:{stats.lowCount}</span>
        <span className="text-gray-400">H:{stats.hiddenCount}</span>
      </div>
    </div>
  );
});

InstancedPlayersPerformanceMonitor.displayName = 'InstancedPlayersPerformanceMonitor';

export default InstancedPlayersV3;
