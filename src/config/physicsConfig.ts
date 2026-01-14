// Physics material presets for different objects
export const PHYSICS_MATERIALS = {
  beanbag: {
    friction: 0.8,
    frictionAir: 0.02,
    restitution: 0.1, // Low bounce - thuds and slides
    density: 0.002,
  },
  basketball: {
    friction: 0.3,
    frictionAir: 0.01,
    restitution: 0.8, // High bounce
    density: 0.001,
  },
  soccerBall: {
    friction: 0.4,
    frictionAir: 0.01,
    restitution: 0.6,
    density: 0.001,
  },
  football: {
    friction: 0.5,
    frictionAir: 0.015,
    restitution: 0.4,
    density: 0.0015,
  },
  wiffleBall: {
    friction: 0.2,
    frictionAir: 0.05, // High air friction
    restitution: 0.3,
    density: 0.0005, // Very light
  },
  wood: {
    friction: 0.6,
    restitution: 0.2,
  },
  metal: {
    friction: 0.3,
    restitution: 0.7,
  },
} as const;

// Flick/launch configuration
export const FLICK_CONFIG = {
  forceMultiplier: 0.00015, // Convert pixel distance to Matter force
  maxVelocity: 25, // Prevent tunneling
  minSwipeDistance: 20, // Minimum pixels to register as a flick
  maxSwipeTime: 500, // Maximum ms for a valid flick
} as const;

// Miss/respawn configuration
export const MISS_CONFIG = {
  respawnDelayMs: 300,
  velocityThreshold: 0.5, // Ball considered "stopped" below this
  stoppedTimeMs: 1000, // Time ball must be stopped to trigger miss
} as const;

// Collision categories for filtering
export const COLLISION_CATEGORIES = {
  default: 0x0001,
  ball: 0x0002,
  obstacle: 0x0004,
  sensor: 0x0008,
  goalie: 0x0010,
} as const;
