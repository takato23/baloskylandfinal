/**
 * Physics Configuration
 * Central location for all physics-related constants
 */

export const PHYSICS = {
  // World gravity
  GRAVITY: [0, -40, 0] as const,

  // Player movement
  PLAYER: {
    MOVEMENT_SPEED: 5,
    RUN_MULTIPLIER: 1.8,
    JUMP_FORCE: 8,
    LINEAR_DAMPING: 0.1,
    ANGULAR_DAMPING: 1,
    // Animation thresholds
    MOVING_THRESHOLD: 0.1,
    GROUNDED_VELOCITY_THRESHOLD: 0.1,
    // Step sounds
    WALK_STEP_INTERVAL: 0.45,
    RUN_STEP_INTERVAL: 0.3,
    // Collision
    CAPSULE_HALF_HEIGHT: 0.3,
    CAPSULE_RADIUS: 0.3,
    // Fall detection
    FALL_RESET_Y: -10,
    SPAWN_POSITION: [0, 5, 5] as const,
  },

  // Skateboard physics (arcade style)
  SKATEBOARD: {
    // Movement
    PUSH_FORCE: 12,           // Force per push
    MAX_SPEED: 18,            // Maximum speed
    FRICTION: 0.98,           // Ground friction (per frame)
    AIR_FRICTION: 0.995,      // Air friction
    BRAKE_FRICTION: 0.92,     // When braking
    // Turning
    TURN_SPEED: 2.5,          // Base turn rate
    TURN_SPEED_FACTOR: 0.15,  // How much speed affects turning
    // Tricks
    OLLIE_FORCE: 12,          // Jump force
    KICKFLIP_ROTATION: Math.PI * 2,
    KICKFLIP_DURATION: 0.5,
    // Camera
    CAM_HEIGHT: 4,
    CAM_DISTANCE: 8,
    CAM_LERP: 3,
    // Timers
    PUSH_COOLDOWN: 0.4,
    TRICK_COOLDOWN: 0.6,
    DISMOUNT_DELAY: 0.5,
    // Legacy (for compatibility)
    MASS: 10,
    EXIT_OFFSET: [2, 1, 0] as const,
  },

  // NPC Car traffic
  NPC_CAR: {
    SPEED: 8,
    STOP_DISTANCE: 12,
    INTERSECTION_CHECK_DISTANCE: 15,
    WRAP_BOUNDARY: 60,
  },

  // Camera
  CAMERA: {
    PLAYER_OFFSET: [0, 6, 8] as const,
    VEHICLE_OFFSET: [0, 8, 12] as const,
    LOOK_OFFSET_Y: 1,
    LERP_FACTOR: 0.1,
  },
} as const;

// Type exports for type safety
export type PhysicsConfig = typeof PHYSICS;
export type PlayerPhysics = typeof PHYSICS.PLAYER;
export type SkateboardPhysics = typeof PHYSICS.SKATEBOARD;
