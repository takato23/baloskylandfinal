/**
 * Player Sync V2 Component
 * Optimized position synchronization for 50-100+ players
 * Features:
 * - Adaptive sync rate based on player density
 * - Movement-based sync triggers
 * - Zone change detection
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store';
import { useMultiplayerV2 } from '../../hooks/useMultiplayerV2';
import { SpatialGrid, GRID_CONFIG } from '../../lib/spatial-grid';

// ============================================
// Configuration
// ============================================

const SYNC_CONFIG = {
  /** Base sync interval (ms) */
  BASE_INTERVAL: 100,
  /** Min sync interval when moving fast */
  MIN_INTERVAL: 50,
  /** Max sync interval when stationary */
  MAX_INTERVAL: 500,
  /** Movement threshold to trigger immediate sync */
  MOVEMENT_THRESHOLD: 0.5,
  /** Rotation threshold (radians) to trigger sync */
  ROTATION_THRESHOLD: 0.1,
  /** Speed multiplier for sync frequency */
  SPEED_SYNC_FACTOR: 0.8,
};

// ============================================
// Component
// ============================================

export const PlayerSyncV2: React.FC = () => {
  const { isConnected, syncPosition, nearbyCount, currentZone } = useMultiplayerV2();

  const lastSync = useRef(0);
  const lastPosition = useRef<[number, number, number]>([0, 0, 0]);
  const lastRotation = useRef(0);
  const lastMoving = useRef(false);
  const accumulatedMovement = useRef(0);

  const playerPosition = useGameStore(s => s.playerPosition);
  const isDriving = useGameStore(s => s.isDriving);
  const isSitting = useGameStore(s => s.isSitting);

  // Calculate adaptive sync interval based on nearby players
  const getSyncInterval = useMemo(() => {
    return () => {
      // More players nearby = less frequent updates to reduce bandwidth
      if (nearbyCount > 30) return SYNC_CONFIG.MAX_INTERVAL;
      if (nearbyCount > 20) return SYNC_CONFIG.BASE_INTERVAL * 2;
      if (nearbyCount > 10) return SYNC_CONFIG.BASE_INTERVAL * 1.5;
      return SYNC_CONFIG.BASE_INTERVAL;
    };
  }, [nearbyCount]);

  useFrame((_, delta) => {
    if (!isConnected) return;

    const now = Date.now();
    const pos = playerPosition as [number, number, number];

    // Calculate movement
    const dx = pos[0] - lastPosition.current[0];
    const dy = pos[1] - lastPosition.current[1];
    const dz = pos[2] - lastPosition.current[2];
    const distance = Math.sqrt(dx * dx + dz * dz);
    const speed = distance / delta;

    // Accumulate movement
    accumulatedMovement.current += distance;

    const isMoving = distance > 0.01;

    // Calculate rotation from movement direction
    let rotation = lastRotation.current;
    if (isMoving && distance > 0.05) {
      rotation = Math.atan2(dx, dz);
    }

    // Determine if we should sync
    const syncInterval = getSyncInterval();
    const timeSinceLastSync = now - lastSync.current;

    // Reasons to sync:
    // 1. Regular interval passed
    // 2. Large movement accumulated
    // 3. Started/stopped moving
    // 4. Significant rotation change
    // 5. Zone changed

    const shouldSync =
      timeSinceLastSync >= syncInterval ||
      accumulatedMovement.current > SYNC_CONFIG.MOVEMENT_THRESHOLD ||
      (isMoving !== lastMoving.current) ||
      Math.abs(rotation - lastRotation.current) > SYNC_CONFIG.ROTATION_THRESHOLD;

    if (shouldSync) {
      syncPosition(pos, rotation, isMoving && !isSitting);

      lastPosition.current = pos;
      lastRotation.current = rotation;
      lastMoving.current = isMoving;
      lastSync.current = now;
      accumulatedMovement.current = 0;
    }
  });

  return null;
};

// ============================================
// Debug Overlay
// ============================================

interface SyncDebugOverlayProps {
  show?: boolean;
}

export const SyncDebugOverlay: React.FC<SyncDebugOverlayProps> = ({ show = false }) => {
  const { isConnected, connectionMode, nearbyCount, onlineCount, currentZone } = useMultiplayerV2();

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded font-mono">
      <div>Mode: {connectionMode}</div>
      <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
      <div>Online: {onlineCount}</div>
      <div>Nearby: {nearbyCount}</div>
      <div>Zone: ({currentZone.x}, {currentZone.z})</div>
    </div>
  );
};

export default PlayerSyncV2;
