/**
 * Spatial Grid System for Multiplayer Optimization
 * Divides the world into zones for efficient player culling and broadcasting
 * Designed to support 50-100+ concurrent players
 */

// ============================================
// Configuration
// ============================================

export const GRID_CONFIG = {
  /** Size of each zone in world units */
  ZONE_SIZE: 50,
  /** Number of zones in each direction from center */
  GRID_RADIUS: 10,
  /** Maximum players to render per zone */
  MAX_PLAYERS_PER_ZONE: 15,
  /** Total maximum visible players */
  MAX_VISIBLE_PLAYERS: 50,
  /** Zone update interval in ms */
  ZONE_UPDATE_INTERVAL: 200,
  /** Distance levels for LOD */
  LOD_DISTANCES: {
    FULL: 30,      // Full detail (model, name, animations)
    MEDIUM: 60,    // Medium detail (simple model, name)
    LOW: 100,      // Low detail (capsule only)
    HIDDEN: 150,   // Don't render
  },
  /** Interest areas - adjacent zones to subscribe to */
  INTEREST_RADIUS: 1, // Subscribe to 3x3 zones around player
};

// ============================================
// Types
// ============================================

export interface ZoneCoord {
  x: number;
  z: number;
}

export interface PlayerZoneInfo {
  odIduserId: string;
  position: [number, number, number];
  zone: ZoneCoord;
  distance: number;
  lodLevel: 'full' | 'medium' | 'low' | 'hidden';
}

export interface ZoneState {
  players: Map<string, PlayerZoneInfo>;
  lastUpdate: number;
}

// ============================================
// Spatial Grid Class
// ============================================

export class SpatialGrid {
  private zones: Map<string, ZoneState> = new Map();
  private playerZones: Map<string, string> = new Map(); // userId -> zoneKey
  private localPlayerZone: ZoneCoord = { x: 0, z: 0 };
  private interestZones: Set<string> = new Set();

  /**
   * Get zone key from coordinates
   */
  static getZoneKey(zone: ZoneCoord): string {
    return `${zone.x},${zone.z}`;
  }

  /**
   * Get zone coordinates from world position
   */
  static getZoneFromPosition(position: [number, number, number]): ZoneCoord {
    return {
      x: Math.floor(position[0] / GRID_CONFIG.ZONE_SIZE),
      z: Math.floor(position[2] / GRID_CONFIG.ZONE_SIZE),
    };
  }

  /**
   * Get world position center of a zone
   */
  static getZoneCenter(zone: ZoneCoord): [number, number, number] {
    return [
      (zone.x + 0.5) * GRID_CONFIG.ZONE_SIZE,
      0,
      (zone.z + 0.5) * GRID_CONFIG.ZONE_SIZE,
    ];
  }

  /**
   * Calculate distance between two positions (2D, ignoring Y)
   */
  static getDistance(
    pos1: [number, number, number],
    pos2: [number, number, number]
  ): number {
    const dx = pos1[0] - pos2[0];
    const dz = pos1[2] - pos2[2];
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * Get LOD level based on distance
   */
  static getLODLevel(distance: number): 'full' | 'medium' | 'low' | 'hidden' {
    if (distance <= GRID_CONFIG.LOD_DISTANCES.FULL) return 'full';
    if (distance <= GRID_CONFIG.LOD_DISTANCES.MEDIUM) return 'medium';
    if (distance <= GRID_CONFIG.LOD_DISTANCES.LOW) return 'low';
    return 'hidden';
  }

  /**
   * Get zones of interest for a position (3x3 grid around player)
   */
  static getInterestZones(zone: ZoneCoord): ZoneCoord[] {
    const zones: ZoneCoord[] = [];
    const radius = GRID_CONFIG.INTEREST_RADIUS;

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        zones.push({
          x: zone.x + dx,
          z: zone.z + dz,
        });
      }
    }

    return zones;
  }

  /**
   * Update local player position and recalculate interest zones
   */
  updateLocalPlayer(position: [number, number, number]): {
    zoneChanged: boolean;
    newZone: ZoneCoord;
    interestZones: string[];
  } {
    const newZone = SpatialGrid.getZoneFromPosition(position);
    const oldZoneKey = SpatialGrid.getZoneKey(this.localPlayerZone);
    const newZoneKey = SpatialGrid.getZoneKey(newZone);

    const zoneChanged = oldZoneKey !== newZoneKey;

    if (zoneChanged) {
      this.localPlayerZone = newZone;

      // Update interest zones
      this.interestZones.clear();
      const interestZones = SpatialGrid.getInterestZones(newZone);
      interestZones.forEach(z => {
        this.interestZones.add(SpatialGrid.getZoneKey(z));
      });
    }

    return {
      zoneChanged,
      newZone,
      interestZones: Array.from(this.interestZones),
    };
  }

  /**
   * Add or update a remote player in the grid
   */
  updatePlayer(
    odIduserId: string,
    position: [number, number, number],
    localPosition: [number, number, number]
  ): PlayerZoneInfo {
    const zone = SpatialGrid.getZoneFromPosition(position);
    const zoneKey = SpatialGrid.getZoneKey(zone);
    const distance = SpatialGrid.getDistance(position, localPosition);
    const lodLevel = SpatialGrid.getLODLevel(distance);

    const playerInfo: PlayerZoneInfo = {
      odIduserId,
      position,
      zone,
      distance,
      lodLevel,
    };

    // Remove from old zone if moved
    const oldZoneKey = this.playerZones.get(odIduserId);
    if (oldZoneKey && oldZoneKey !== zoneKey) {
      const oldZone = this.zones.get(oldZoneKey);
      if (oldZone) {
        oldZone.players.delete(odIduserId);
      }
    }

    // Add to new zone
    let zoneState = this.zones.get(zoneKey);
    if (!zoneState) {
      zoneState = { players: new Map(), lastUpdate: Date.now() };
      this.zones.set(zoneKey, zoneState);
    }

    zoneState.players.set(odIduserId, playerInfo);
    zoneState.lastUpdate = Date.now();
    this.playerZones.set(odIduserId, zoneKey);

    return playerInfo;
  }

  /**
   * Remove a player from the grid
   */
  removePlayer(odIduserId: string): void {
    const zoneKey = this.playerZones.get(odIduserId);
    if (zoneKey) {
      const zone = this.zones.get(zoneKey);
      if (zone) {
        zone.players.delete(odIduserId);
      }
      this.playerZones.delete(odIduserId);
    }
  }

  /**
   * Get visible players sorted by distance, limited by MAX_VISIBLE_PLAYERS
   */
  getVisiblePlayers(localPosition: [number, number, number]): PlayerZoneInfo[] {
    const visible: PlayerZoneInfo[] = [];

    // Only check interest zones
    for (const zoneKey of this.interestZones) {
      const zone = this.zones.get(zoneKey);
      if (!zone) continue;

      for (const player of zone.players.values()) {
        // Update distance and LOD
        player.distance = SpatialGrid.getDistance(player.position, localPosition);
        player.lodLevel = SpatialGrid.getLODLevel(player.distance);

        if (player.lodLevel !== 'hidden') {
          visible.push(player);
        }
      }
    }

    // Sort by distance and limit
    return visible
      .sort((a, b) => a.distance - b.distance)
      .slice(0, GRID_CONFIG.MAX_VISIBLE_PLAYERS);
  }

  /**
   * Get players in a specific zone
   */
  getPlayersInZone(zone: ZoneCoord): PlayerZoneInfo[] {
    const zoneKey = SpatialGrid.getZoneKey(zone);
    const zoneState = this.zones.get(zoneKey);
    if (!zoneState) return [];
    return Array.from(zoneState.players.values());
  }

  /**
   * Check if a zone is in our interest area
   */
  isZoneOfInterest(zone: ZoneCoord): boolean {
    return this.interestZones.has(SpatialGrid.getZoneKey(zone));
  }

  /**
   * Get total player count across all zones
   */
  getTotalPlayerCount(): number {
    let count = 0;
    for (const zone of this.zones.values()) {
      count += zone.players.size;
    }
    return count;
  }

  /**
   * Get zone statistics for debugging
   */
  getZoneStats(): {
    totalZones: number;
    activeZones: number;
    totalPlayers: number;
    playersPerZone: Map<string, number>;
  } {
    const playersPerZone = new Map<string, number>();
    let activeZones = 0;

    for (const [key, zone] of this.zones) {
      if (zone.players.size > 0) {
        activeZones++;
        playersPerZone.set(key, zone.players.size);
      }
    }

    return {
      totalZones: this.zones.size,
      activeZones,
      totalPlayers: this.getTotalPlayerCount(),
      playersPerZone,
    };
  }

  /**
   * Clean up empty zones (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const staleThreshold = 30000; // 30 seconds

    for (const [key, zone] of this.zones) {
      if (zone.players.size === 0 && now - zone.lastUpdate > staleThreshold) {
        this.zones.delete(key);
      }
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.zones.clear();
    this.playerZones.clear();
    this.interestZones.clear();
  }
}

// ============================================
// Singleton Instance
// ============================================

export const spatialGrid = new SpatialGrid();

// ============================================
// Channel Naming for Zone-Based Subscriptions
// ============================================

/**
 * Get the presence channel name for a zone
 */
export const getZoneChannelName = (zone: ZoneCoord): string => {
  return `zone:${zone.x}:${zone.z}`;
};

/**
 * Get all channel names for interest zones
 */
export const getInterestChannelNames = (zone: ZoneCoord): string[] => {
  return SpatialGrid.getInterestZones(zone).map(getZoneChannelName);
};

// ============================================
// Delta Compression Utilities
// ============================================

export interface PositionDelta {
  /** Player ID */
  id: string;
  /** Delta X (0 if unchanged) */
  dx?: number;
  /** Delta Z (0 if unchanged) */
  dz?: number;
  /** Absolute Y (always sent, terrain height changes) */
  y?: number;
  /** Rotation in radians (only if changed significantly) */
  r?: number;
  /** Flags: moving, driving, sitting (bit flags) */
  f?: number;
}

const POSITION_THRESHOLD = 0.1; // Minimum movement to send
const ROTATION_THRESHOLD = 0.05; // ~3 degrees

/**
 * Calculate delta between two positions
 */
export const calculateDelta = (
  oldPos: [number, number, number] | undefined,
  newPos: [number, number, number],
  oldRot: number | undefined,
  newRot: number,
  isMoving: boolean,
  isDriving: boolean,
  isSitting: boolean
): PositionDelta | null => {
  const delta: PositionDelta = { id: '' };
  let hasChanges = false;

  if (!oldPos) {
    // First update, send full position
    delta.dx = newPos[0];
    delta.dz = newPos[2];
    delta.y = newPos[1];
    delta.r = newRot;
    hasChanges = true;
  } else {
    const dx = newPos[0] - oldPos[0];
    const dz = newPos[2] - oldPos[2];

    if (Math.abs(dx) > POSITION_THRESHOLD) {
      delta.dx = Math.round(dx * 100) / 100;
      hasChanges = true;
    }
    if (Math.abs(dz) > POSITION_THRESHOLD) {
      delta.dz = Math.round(dz * 100) / 100;
      hasChanges = true;
    }
    if (Math.abs(newPos[1] - oldPos[1]) > POSITION_THRESHOLD) {
      delta.y = Math.round(newPos[1] * 100) / 100;
      hasChanges = true;
    }

    if (oldRot !== undefined) {
      const rotDiff = Math.abs(newRot - oldRot);
      if (rotDiff > ROTATION_THRESHOLD) {
        delta.r = Math.round(newRot * 100) / 100;
        hasChanges = true;
      }
    } else {
      delta.r = Math.round(newRot * 100) / 100;
      hasChanges = true;
    }
  }

  // Pack flags into single byte
  const flags = (isMoving ? 1 : 0) | (isDriving ? 2 : 0) | (isSitting ? 4 : 0);
  delta.f = flags;

  return hasChanges ? delta : null;
};

/**
 * Apply delta to reconstruct position
 */
export const applyDelta = (
  currentPos: [number, number, number],
  currentRot: number,
  delta: PositionDelta
): {
  position: [number, number, number];
  rotation: number;
  isMoving: boolean;
  isDriving: boolean;
  isSitting: boolean;
} => {
  const position: [number, number, number] = [
    currentPos[0] + (delta.dx ?? 0),
    delta.y ?? currentPos[1],
    currentPos[2] + (delta.dz ?? 0),
  ];

  const rotation = delta.r ?? currentRot;
  const flags = delta.f ?? 0;

  return {
    position,
    rotation,
    isMoving: (flags & 1) !== 0,
    isDriving: (flags & 2) !== 0,
    isSitting: (flags & 4) !== 0,
  };
};

// ============================================
// Batch Update System
// ============================================

export interface BatchUpdate {
  zone: string;
  updates: PositionDelta[];
  timestamp: number;
}

/**
 * Create a batch update from multiple position deltas
 */
export const createBatchUpdate = (
  zone: ZoneCoord,
  deltas: Map<string, PositionDelta>
): BatchUpdate => {
  return {
    zone: SpatialGrid.getZoneKey(zone),
    updates: Array.from(deltas.entries()).map(([id, delta]) => ({
      ...delta,
      id,
    })),
    timestamp: Date.now(),
  };
};
