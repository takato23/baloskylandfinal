/**
 * Distance-based Culling Hook
 * Hides objects that are far from the player to improve mobile performance
 */

import { useMemo } from 'react';
import { useGameStore } from '../store';

/**
 * Check if an object at the given position should be visible
 * based on distance from player
 */
export function useDistanceCulling(
  position: [number, number, number],
  threshold?: number
): boolean {
  const playerPosition = useGameStore(s => s.playerPosition);
  const qualityLevel = useGameStore(s => s.qualityLevel);

  // Determine culling distance based on quality
  const cullDistance = useMemo(() => {
    if (threshold !== undefined) return threshold;

    switch (qualityLevel) {
      case 'mobile': return 25;
      case 'low': return 35;
      case 'medium': return 50;
      case 'high': return 80;
      default: return 40;
    }
  }, [qualityLevel, threshold]);

  // Calculate if visible
  const isVisible = useMemo(() => {
    const dx = position[0] - playerPosition[0];
    const dz = position[2] - playerPosition[2];
    const distSq = dx * dx + dz * dz;
    return distSq < cullDistance * cullDistance;
  }, [position, playerPosition, cullDistance]);

  return isVisible;
}

/**
 * Get the appropriate LOD level based on distance
 * Returns: 'high' | 'medium' | 'low' | 'hidden'
 */
export function useLODLevel(
  position: [number, number, number]
): 'high' | 'medium' | 'low' | 'hidden' {
  const playerPosition = useGameStore(s => s.playerPosition);
  const qualityLevel = useGameStore(s => s.qualityLevel);

  return useMemo(() => {
    const dx = position[0] - playerPosition[0];
    const dz = position[2] - playerPosition[2];
    const distSq = dx * dx + dz * dz;

    // Adjust thresholds based on quality
    const multiplier = qualityLevel === 'mobile' ? 0.5 :
                       qualityLevel === 'low' ? 0.7 : 1;

    const highThreshold = 15 * multiplier;
    const mediumThreshold = 35 * multiplier;
    const lowThreshold = 60 * multiplier;

    if (distSq < highThreshold * highThreshold) return 'high';
    if (distSq < mediumThreshold * mediumThreshold) return 'medium';
    if (distSq < lowThreshold * lowThreshold) return 'low';
    return 'hidden';
  }, [position, playerPosition, qualityLevel]);
}
