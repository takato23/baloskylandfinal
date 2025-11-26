/**
 * World Generation Configuration
 * Constants for city grid, blocks, and terrain generation
 */

export const WORLD = {
  // Grid layout
  GRID_SIZE: 5,
  BLOCK_SIZE: 10,
  SIDEWALK_WIDTH: 1.5,
  SIDEWALK_HEIGHT: 0.15,
  STREET_WIDTH: 6,

  // Computed values (derived from above)
  get CELL_SIZE() {
    return this.BLOCK_SIZE + (this.SIDEWALK_WIDTH * 2) + this.STREET_WIDTH;
  },
  get MAP_SIZE() {
    return this.GRID_SIZE * this.CELL_SIZE;
  },

  // Boundary walls
  BOUNDARY: {
    EXTRA_SIZE: 5,
    WALL_HEIGHT: 10,
    WALL_THICKNESS: 2,
  },

  // Building generation
  BUILDING: {
    MIN_HEIGHT: 3,
    HEIGHT_VARIANCE: 3,
    VARIANTS: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'] as const,
    // Categories
    FOOD_PLACES: ['H', 'M', 'T', 'U', 'X', 'C'],
    SHOPS: ['I', 'Q', 'S', 'V', 'W', 'Z'],
    RESIDENTIAL: ['A', 'B', 'G', 'N', 'P'],
    CIVIC: ['F', 'J', 'K', 'O', 'R'],
    SCHOOL_VARIANT: 'J',
  },

  // Road markings
  ROAD: {
    CROSSWALK_STRIPE_WIDTH: 0.5,
    CROSSWALK_GAP: 0.3,
    CROSSWALK_STRIPE_COUNT: 4,
    CENTER_LINE_WIDTH: 0.2,
    PARKING_LINE_LENGTH: 2,
  },

  // Traffic system
  TRAFFIC: {
    CYCLE: [
      { state: 'NS_GREEN', duration: 5000 },
      { state: 'NS_YELLOW', duration: 2000 },
      { state: 'ALL_RED', duration: 1000 },
      { state: 'EW_GREEN', duration: 5000 },
      { state: 'EW_YELLOW', duration: 2000 },
      { state: 'ALL_RED', duration: 1000 },
    ] as const,
    LANE_OFFSET: 2,
    ROAD_INDICES: [-2, -1, 0, 1],
  },

  // Decoration spawn probabilities (using modulo)
  DECORATION: {
    FIRE_HYDRANT_MOD: 3,
    BUS_STOP_MOD: 7,
    STREET_LAMP_CORNER_MOD: 2,
    STREET_LAMP_MID_MOD: 4,
    STREET_SIGN_MOD: 4,
    SPEED_BUMP_MOD: 5,
  },
} as const;

// Type exports
export type WorldConfig = typeof WORLD;
export type TrafficState = typeof WORLD.TRAFFIC.CYCLE[number]['state'];
export type BuildingVariant = typeof WORLD.BUILDING.VARIANTS[number];
