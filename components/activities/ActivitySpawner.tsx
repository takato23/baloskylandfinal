/**
 * ActivitySpawner - Animal Crossing-style activity spawning system
 * Spawns fishing spots, bugs, and fossils based on time, weather, and location
 */

import { useEffect, useState, useMemo } from 'react';
import { useGameStore } from '../../store';
import { BugSpawn } from './BugSpawn';
import { FossilSpot } from './FossilSpot';
import { getActiveBugs } from '../../data/bugs';
import type { Bug } from '../../types/collectibles';
// Note: FishingSpot is no longer used here - fishing is handled by dedicated FishingPond in World.tsx

interface ActivitySpawnerProps {
  // World configuration
  gridSize?: number;
  cellSize?: number;
  blockSize?: number;
}

// Spawn configuration
const SPAWN_CONFIG = {
  bugs: {
    maxPerBlock: 2,
    respawnInterval: 300000, // 5 minutes
  },
  fossils: {
    maxTotal: 4,
    refreshDaily: true,
  },
  // Note: Fishing is now handled by dedicated FishingPond component in World.tsx
};

export function ActivitySpawner({
  gridSize = 3,
  cellSize = 19,
  blockSize = 10,
}: ActivitySpawnerProps) {
  const weather = useGameStore((s) => s.weather);
  const isNight = useGameStore((s) => s.isNight);

  // Get current time for spawning logic
  const currentHour = new Date().getHours();
  const currentMonth = new Date().getMonth() + 1;
  const currentDate = new Date().toISOString().split('T')[0];

  // State for dynamic spawns
  const [bugSpawns, setBugSpawns] = useState<Array<{ id: string; bug: Bug; position: [number, number, number] }>>([]);
  const [fossilSpawns, setFossilSpawns] = useState<Array<{ id: string; position: [number, number, number]; date: string }>>([]);
  const [lastBugSpawn, setLastBugSpawn] = useState(Date.now());

  // Get active bugs based on current conditions
  const weatherStr = weather === 'rain' ? 'rain' : weather === 'sunny' ? 'sunny' : 'any';
  const activeBugs = useMemo(
    () => getActiveBugs(currentHour, currentMonth, weatherStr),
    [currentHour, currentMonth, weatherStr]
  );

  // Note: Fishing spots are now handled by the dedicated FishingPond component in World.tsx

  // Generate bug spawns
  useEffect(() => {
    const spawnBugs = () => {
      if (activeBugs.length === 0) {
        setBugSpawns([]);
        return;
      }

      const newSpawns: Array<{ id: string; bug: Bug; position: [number, number, number] }> = [];
      const range = Math.floor(gridSize / 2);

      // Spawn bugs in different locations based on type
      for (let x = -range; x <= range; x++) {
        for (let z = -range; z <= range; z++) {
          const blockX = x * cellSize;
          const blockZ = z * cellSize;
          const isCenter = x === 0 && z === 0;

          // Center park has more bug spawns
          const maxBugs = isCenter ? 4 : SPAWN_CONFIG.bugs.maxPerBlock;
          const spawnCount = Math.min(
            maxBugs,
            Math.floor(Math.random() * (maxBugs + 1))
          );

          for (let i = 0; i < spawnCount; i++) {
            // Select random bug from active bugs
            const bug = activeBugs[Math.floor(Math.random() * activeBugs.length)];

            // Position based on bug location preference
            let spawnX = blockX;
            let spawnY = 0.3;
            let spawnZ = blockZ;

            if (bug.location === 'flower') {
              // Near flowers/bushes in park areas
              spawnX += (Math.random() - 0.5) * (blockSize * 0.6);
              spawnZ += (Math.random() - 0.5) * (blockSize * 0.6);
              spawnY = 0.5;
            } else if (bug.location === 'tree') {
              // Near trees (corners of blocks)
              const treePositions = [
                [-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]
              ];
              const treePos = treePositions[Math.floor(Math.random() * treePositions.length)];
              spawnX += treePos[0];
              spawnZ += treePos[1];
              spawnY = 1.5; // On tree trunk
            } else if (bug.location === 'air') {
              // Flying bugs - random height
              spawnX += (Math.random() - 0.5) * (blockSize * 0.8);
              spawnZ += (Math.random() - 0.5) * (blockSize * 0.8);
              spawnY = 1 + Math.random() * 1.5;
            } else if (bug.location === 'ground') {
              // Ground bugs - grass areas
              spawnX += (Math.random() - 0.5) * (blockSize * 0.7);
              spawnZ += (Math.random() - 0.5) * (blockSize * 0.7);
              spawnY = 0.25;
            } else if (bug.location === 'water_surface') {
              // Only spawn near fountain
              if (isCenter) {
                spawnX += (Math.random() - 0.5) * 2;
                spawnZ += (Math.random() - 0.5) * 2;
                spawnY = 0.25;
              } else {
                continue; // Skip if not near water
              }
            }

            newSpawns.push({
              id: `bug_${x}_${z}_${i}_${Date.now()}`,
              bug,
              position: [spawnX, spawnY, spawnZ],
            });
          }
        }
      }

      setBugSpawns(newSpawns);
      setLastBugSpawn(Date.now());
    };

    // Initial spawn
    spawnBugs();

    // Respawn bugs periodically
    const interval = setInterval(spawnBugs, SPAWN_CONFIG.bugs.respawnInterval);

    return () => clearInterval(interval);
  }, [activeBugs, gridSize, cellSize, blockSize]);

  // Generate fossil spawns (daily refresh)
  useEffect(() => {
    const spawnFossils = () => {
      const newSpawns: Array<{ id: string; position: [number, number, number]; date: string }> = [];
      const range = Math.floor(gridSize / 2);

      // Spawn fossils randomly in grass areas
      for (let i = 0; i < SPAWN_CONFIG.fossils.maxTotal; i++) {
        const x = -range + Math.floor(Math.random() * (gridSize + 1));
        const z = -range + Math.floor(Math.random() * (gridSize + 1));

        const blockX = x * cellSize;
        const blockZ = z * cellSize;

        // Random position within block (grass areas only)
        const offsetX = (Math.random() - 0.5) * (blockSize * 0.6);
        const offsetZ = (Math.random() - 0.5) * (blockSize * 0.6);

        newSpawns.push({
          id: `fossil_${i}_${currentDate}`,
          position: [blockX + offsetX, 0.2, blockZ + offsetZ],
          date: currentDate,
        });
      }

      setFossilSpawns(newSpawns);
    };

    // Check if we need to refresh fossils
    const needsRefresh = fossilSpawns.length === 0 ||
      (fossilSpawns[0] && fossilSpawns[0].date !== currentDate);

    if (needsRefresh) {
      spawnFossils();
    }
  }, [currentDate, gridSize, cellSize, blockSize]);

  // Handle bug catch (remove from spawns)
  const handleBugCatch = (bugId: string) => {
    setBugSpawns((prev) => prev.filter((spawn) => spawn.id !== bugId));
  };

  // Handle bug escape (remove from spawns)
  const handleBugEscape = (bugId: string) => {
    setBugSpawns((prev) => prev.filter((spawn) => spawn.id !== bugId));
  };

  // Handle fossil dig (remove from spawns)
  const handleFossilDig = (fossilId: string) => {
    setFossilSpawns((prev) => prev.filter((spawn) => spawn.id !== fossilId));
  };

  return (
    <group name="activity-spawner">
      {/* Note: Fishing is now handled by dedicated FishingPond component in World.tsx */}

      {/* Bug Spawns */}
      {bugSpawns.map((spawn) => (
        <BugSpawn
          key={spawn.id}
          position={spawn.position}
          bug={spawn.bug}
          onCatch={() => handleBugCatch(spawn.id)}
          onEscape={() => handleBugEscape(spawn.id)}
        />
      ))}

      {/* Fossil Spots */}
      {fossilSpawns.map((spawn) => (
        <FossilSpot
          key={spawn.id}
          position={spawn.position}
          onDig={() => handleFossilDig(spawn.id)}
        />
      ))}
    </group>
  );
}

export default ActivitySpawner;
