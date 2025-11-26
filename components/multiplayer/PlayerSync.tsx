/**
 * Player Sync Component
 * Syncs local player position to the multiplayer presence system
 * Should be placed inside the Canvas context
 */

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store';
import { useMultiplayer } from '../../hooks/useMultiplayer';

const SYNC_INTERVAL = 100; // ms between syncs

export const PlayerSync: React.FC = () => {
  const { isConnected, syncPosition } = useMultiplayer();
  const lastSync = useRef(0);
  const lastPosition = useRef<[number, number, number]>([0, 0, 0]);
  const lastRotation = useRef(0);

  const playerPosition = useGameStore((s) => s.playerPosition);
  const isDriving = useGameStore((s) => s.isDriving);
  const isSitting = useGameStore((s) => s.isSitting);

  useFrame((state) => {
    if (!isConnected) return;

    const now = Date.now();
    if (now - lastSync.current < SYNC_INTERVAL) return;

    // Get current position
    const pos = playerPosition as [number, number, number];

    // Calculate movement
    const dx = pos[0] - lastPosition.current[0];
    const dz = pos[2] - lastPosition.current[2];
    const isMoving = Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01;

    // Calculate rotation from movement direction
    let rotation = lastRotation.current;
    if (isMoving) {
      rotation = Math.atan2(dx, dz);
      lastRotation.current = rotation;
    }

    // Sync to server
    syncPosition(pos, rotation, isMoving && !isSitting);

    lastPosition.current = pos;
    lastSync.current = now;
  });

  return null;
};

export default PlayerSync;
