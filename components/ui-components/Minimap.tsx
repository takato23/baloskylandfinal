/**
 * Minimap Component
 * Shows a top-down view of the city with player position
 */

import React, { useEffect, useRef, memo } from 'react';
import { useGameStore } from '../../store';
import { WORLD } from '../../config';

// Building type colors for minimap
const BUILDING_COLORS = {
  park: '#a5d6a7',
  residential: '#ffccbc',
  commercial: '#b3e5fc',
  civic: '#e1bee7',
} as const;

// Determine building type based on grid position
function getBuildingType(x: number, z: number): keyof typeof BUILDING_COLORS {
  const seed = Math.abs(x * 7 + z * 13);
  const hasBuilding = seed % 3 !== 0;
  if (!hasBuilding) return 'park';

  const variants = WORLD.BUILDING.VARIANTS;
  const variant = variants[seed % variants.length];

  // Use type assertion for .includes() to work with readonly arrays
  const foodPlaces = WORLD.BUILDING.FOOD_PLACES as readonly string[];
  const shops = WORLD.BUILDING.SHOPS as readonly string[];
  const civic = WORLD.BUILDING.CIVIC as readonly string[];

  if (foodPlaces.includes(variant) || shops.includes(variant)) {
    return 'commercial';
  }
  if (civic.includes(variant)) {
    return 'civic';
  }
  return 'residential';
}

interface MinimapProps {
  size?: 'small' | 'medium' | 'large';
  dimmed?: boolean;
  highContrast?: boolean;
}

export const Minimap: React.FC<MinimapProps> = memo(({ size = 'medium', dimmed = false, highContrast = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Size configurations
  const sizeConfig = {
    small: { container: 'w-24 h-24', canvas: 150 },
    medium: { container: 'w-32 h-32 md:w-48 md:h-48', canvas: 200 },
    large: { container: 'w-48 h-48 md:w-64 md:h-64', canvas: 300 },
  };

  const config = sizeConfig[size];

  // Draw static map once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const GRID_SIZE = WORLD.GRID_SIZE;
    const CELL_SIZE = 19;
    const MAP_SIZE = GRID_SIZE * CELL_SIZE;
    const mapScale = canvas.width / MAP_SIZE;
    const centerOffset = MAP_SIZE / 2;
    const range = Math.floor(GRID_SIZE / 2);

    // Draw static map (only once)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Map Grid
    for (let x = -range; x <= range; x++) {
      for (let z = -range; z <= range; z++) {
        const type = getBuildingType(x, z);
        const color = BUILDING_COLORS[type];

        const wx = x * CELL_SIZE;
        const wz = z * CELL_SIZE;

        const cx = (wx + centerOffset) * mapScale;
        const cy = (wz + centerOffset) * mapScale;
        const cellSize = CELL_SIZE * mapScale;

        ctx.fillStyle = color;
        ctx.fillRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);
      }
    }

    // Draw streets
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 1;
    for (let i = -range; i <= range + 1; i++) {
      const pos = (i * CELL_SIZE + centerOffset - CELL_SIZE / 2) * mapScale;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(canvas.width, pos);
      ctx.stroke();
    }
  }, []);

  // Update player position with throttled interval (100ms instead of 60fps RAF)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const GRID_SIZE = WORLD.GRID_SIZE;
    const CELL_SIZE = 19;
    const MAP_SIZE = GRID_SIZE * CELL_SIZE;
    const mapScale = canvas.width / MAP_SIZE;
    const centerOffset = MAP_SIZE / 2;
    const range = Math.floor(GRID_SIZE / 2);

    // Store last player position to avoid unnecessary redraws
    let lastPx = -1;
    let lastPy = -1;

    const updatePlayer = () => {
      const playerPos = useGameStore.getState().playerPosition;
      const worldToMap = (world: number) => (world / (WORLD.GRID_SIZE * 19) + 0.5) * canvas.width;
      const px = Math.round(worldToMap(playerPos[0]));
      const py = Math.round(worldToMap(playerPos[2]));

      // Skip if position hasn't changed
      if (px === lastPx && py === lastPy) return;

      // Redraw static map portion where player was
      if (lastPx >= 0) {
        // Clear old player area
        const clearSize = 16;
        ctx.clearRect(lastPx - clearSize / 2, lastPy - clearSize / 2, clearSize, clearSize);

        // Redraw affected grid cells
        for (let x = -range; x <= range; x++) {
          for (let z = -range; z <= range; z++) {
            const wx = x * CELL_SIZE;
            const wz = z * CELL_SIZE;
            const cx = (wx + centerOffset) * mapScale;
            const cy = (wz + centerOffset) * mapScale;
            const cellSize = CELL_SIZE * mapScale;

            // Check if this cell overlaps with cleared area
            if (
              cx + cellSize > lastPx - clearSize / 2 &&
              cx < lastPx + clearSize / 2 &&
              cy + cellSize > lastPy - clearSize / 2 &&
              cy < lastPy + clearSize / 2
            ) {
              const type = getBuildingType(x, z);
              ctx.fillStyle = BUILDING_COLORS[type];
              ctx.fillRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);
            }
          }
        }
      }

      // Draw new player position
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(px + 1, py + 1, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef5350';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      lastPx = px;
      lastPy = py;
    };

    // Update every 100ms instead of 60fps (saves ~15-25ms per frame)
    const intervalId = setInterval(updatePlayer, 100);
    updatePlayer(); // Initial draw

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      className={`absolute top-4 right-4 ${config.container} ${dimmed ? 'opacity-50' : 'opacity-90'} ${highContrast ? 'ring-2 ring-black' : ''} bg-white/90 rounded-lg border-2 border-black overflow-hidden shadow-xl z-10 pointer-events-auto focus:outline-none focus:ring-4 focus:ring-black`}
      tabIndex={0}
      aria-label="Minimapa"
    >
      <canvas
        ref={canvasRef}
        width={config.canvas}
        height={config.canvas}
        className="w-full h-full"
      />
    </div>
  );
});

Minimap.displayName = 'Minimap';
