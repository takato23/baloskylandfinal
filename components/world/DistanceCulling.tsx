import React, { useRef, useMemo, useReducer, ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store';

interface CulledGroupProps {
  children: ReactNode;
  position: [number, number, number];
  cullDistance?: number;
  /** If true, renders a simple placeholder when culled */
  showPlaceholder?: boolean;
}

/**
 * Wrapper component that culls children based on distance from player.
 * Use this for expensive components like LiveNPCs.
 */
export const CulledGroup: React.FC<CulledGroupProps> = ({
  children,
  position,
  cullDistance = 35,
  showPlaceholder = false,
}) => {
  const [visible, setVisible] = React.useState(true);
  const accumulator = useRef(0);
  const lastVisible = useRef(true);

  useFrame((_, delta) => {
    accumulator.current += delta;
    if (accumulator.current < 0.5) return;
    accumulator.current = 0;

    const player = useGameStore.getState().playerPosition;
    const dx = position[0] - player[0];
    const dz = position[2] - player[2];
    const distSq = dx * dx + dz * dz;
    const shouldBeVisible = distSq < cullDistance * cullDistance;

    if (shouldBeVisible !== lastVisible.current) {
      lastVisible.current = shouldBeVisible;
      setVisible(shouldBeVisible);
    }
  });

  if (!visible) {
    if (showPlaceholder) {
      return (
        <mesh position={position}>
          <sphereGeometry args={[0.3, 4, 4]} />
          <meshBasicMaterial color="#888" transparent opacity={0.3} />
        </mesh>
      );
    }
    return null;
  }

  return <group position={position}>{children}</group>;
};

interface NPCData {
  position: [number, number, number];
  rotation?: [number, number, number];
  config: any;
  overrideType?: string;
}

interface CulledNPCManagerProps {
  npcs: NPCData[];
  NPCComponent: React.ComponentType<any>;
  cullDistance?: number;
  maxVisibleNPCs?: number;
}

/**
 * Manages multiple NPCs with distance-based culling and limit.
 * Only renders the closest N NPCs to save performance.
 */
export const CulledNPCManager: React.FC<CulledNPCManagerProps> = ({
  npcs,
  NPCComponent,
  cullDistance = 40,
  maxVisibleNPCs = 8,
}) => {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const visibleNPCsRef = useRef<NPCData[]>([]);
  const accumulator = useRef(0);
  const lastVisibleCount = useRef(0);

  useFrame((_, delta) => {
    accumulator.current += delta;
    if (accumulator.current < 0.4) return;
    accumulator.current = 0;

    const player = useGameStore.getState().playerPosition;

    // Calculate distances and sort
    const withDistances = npcs.map((npc) => {
      const dx = npc.position[0] - player[0];
      const dz = npc.position[2] - player[2];
      return { npc, distSq: dx * dx + dz * dz };
    });

    // Filter by cullDistance and sort by distance
    const cullDistSq = cullDistance * cullDistance;
    const visible = withDistances
      .filter(({ distSq }) => distSq < cullDistSq)
      .sort((a, b) => a.distSq - b.distSq)
      .slice(0, maxVisibleNPCs)
      .map(({ npc }) => npc);

    // Only update if visible count changed
    if (visible.length !== lastVisibleCount.current) {
      visibleNPCsRef.current = visible;
      lastVisibleCount.current = visible.length;
      forceUpdate();
    } else {
      // Check if any NPC changed (simple check by position)
      let changed = false;
      for (let i = 0; i < visible.length; i++) {
        if (
          !visibleNPCsRef.current[i] ||
          visible[i].position[0] !== visibleNPCsRef.current[i].position[0] ||
          visible[i].position[2] !== visibleNPCsRef.current[i].position[2]
        ) {
          changed = true;
          break;
        }
      }
      if (changed) {
        visibleNPCsRef.current = visible;
        forceUpdate();
      }
    }
  });

  return (
    <>
      {visibleNPCsRef.current.map((npc, index) => (
        <NPCComponent
          key={`npc-${npc.config.name}-${index}`}
          position={npc.position}
          rotation={npc.rotation}
          config={npc.config}
          overrideType={npc.overrideType}
        />
      ))}
    </>
  );
};

export default CulledGroup;
