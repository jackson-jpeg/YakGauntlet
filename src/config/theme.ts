// The Yak Gauntlet - Unified Theme & Branding
// Consistent colors, fonts, and styling across all scenes

export const YAK_COLORS = {
  // Primary brand colors
  primary: 0xe74c3c,        // Yak Red - main brand color
  primaryDark: 0xc0392b,    // Darker red for accents
  secondary: 0xf1c40f,      // Gold/Yellow - highlights & accents
  secondaryDark: 0xd4ac0d,  // Darker gold

  // UI colors
  success: 0x27ae60,        // Green - goals, hits, success
  successBright: 0x4ade80,  // Bright green for emphasis
  warning: 0xf39c12,        // Orange - medium power, caution
  danger: 0xe74c3c,         // Red - misses, failures

  // Background colors
  bgDark: 0x1a1a2e,         // Dark blue-black
  bgMedium: 0x16213e,       // Medium dark blue
  bgLight: 0x0f3460,        // Lighter blue accent

  // Text colors (as hex strings for Phaser text)
  textWhite: '#ffffff',
  textGold: '#f1c40f',
  textGreen: '#4ade80',
  textRed: '#ef4444',
  textGray: '#9ca3af',

  // Misc
  white: 0xffffff,
  black: 0x000000,
};

export const YAK_FONTS = {
  title: 'Arial Black',
  body: 'Arial',
  mono: 'Courier New',
};

// Physics constants for consistent, realistic feel across all mini-games
export const PHYSICS = {
  // Gravity values
  GRAVITY_NORMAL: 0.45,        // Standard gravity for most objects
  GRAVITY_HEAVY: 0.55,         // Heavier objects (basketball)
  GRAVITY_LIGHT: 0.35,         // Lighter objects (wiffle ball)

  // Air resistance (applies each frame)
  AIR_RESISTANCE: 0.997,       // Slight air resistance
  AIR_RESISTANCE_HIGH: 0.99,   // Higher air resistance (wiffle ball)

  // Bounce damping (energy lost on bounce)
  BOUNCE_LOW: 0.25,            // Low bounce (beanbag)
  BOUNCE_MEDIUM: 0.5,          // Medium bounce (soccer ball)
  BOUNCE_HIGH: 0.7,            // High bounce (basketball)
  BOUNCE_SUPER: 0.85,          // Very bouncy (special cases)

  // Friction (for sliding/rolling)
  FRICTION_HIGH: 0.92,         // High friction (grass, rough surface)
  FRICTION_MEDIUM: 0.96,       // Medium friction
  FRICTION_LOW: 0.98,          // Low friction (smooth surface)

  // Spin/rotation factors
  SPIN_FACTOR: 0.15,           // How much spin affects trajectory
  SPIN_DECAY: 0.98,            // How quickly spin decays

  // Collision response
  COLLISION_DAMPING: 0.8,      // Energy loss on collision

  // Max values for safety
  MAX_VELOCITY: 50,            // Maximum velocity magnitude
  MIN_VELOCITY: 0.1,           // Minimum velocity before stopping
};

// Station definitions with display info
export const STATIONS = [
  { id: 'cornhole', name: 'CORNHOLE', color: 0xc41e3a, emoji: '🎯' },
  { id: 'goalie', name: 'PENALTY', color: 0x27ae60, emoji: '⚽' },
  { id: 'wiffle', name: 'WIFFLE', color: 0xffca28, emoji: '🏏' },
  { id: 'football', name: 'FOOTBALL', color: 0x92400e, emoji: '🏈' },
  { id: 'corner3_right', name: '3PT RIGHT', color: 0xff6b35, emoji: '🏀' },
  { id: 'corner3_left', name: '3PT LEFT', color: 0xff6b35, emoji: '🏀' },
  { id: 'quiz', name: 'QUIZ', color: 0x8b5cf6, emoji: '🧠' },
] as const;

// Common text styles
export const TEXT_STYLES = {
  timer: {
    fontSize: '48px',
    fontFamily: YAK_FONTS.title,
    color: YAK_COLORS.textWhite,
    stroke: '#000000',
    strokeThickness: 4,
  },
  stationBadge: {
    fontSize: '14px',
    fontFamily: YAK_FONTS.title,
    color: '#ffffff',
  },
  instruction: {
    fontSize: '22px',
    fontFamily: YAK_FONTS.title,
    color: YAK_COLORS.textGold,
    stroke: '#000000',
    strokeThickness: 4,
  },
  feedback: {
    fontSize: '64px',
    fontFamily: YAK_FONTS.title,
    stroke: '#000000',
    strokeThickness: 8,
  },
  missCounter: {
    fontSize: '16px',
    fontFamily: YAK_FONTS.body,
    color: '#ffcdd2',
    stroke: '#000000',
    strokeThickness: 3,
  },
  progress: {
    fontSize: '18px',
    fontFamily: YAK_FONTS.title,
    color: YAK_COLORS.textWhite,
    stroke: '#000000',
    strokeThickness: 3,
  },
};

// Success/fail messages for variety
export const SUCCESS_MESSAGES = [
  'NICE!', 'PERFECT!', 'CRUSHED IT!', 'MONEY!', 'LETS GO!', 'BOOM!', 'CLEAN!'
];

export const FAIL_MESSAGES = {
  miss: ['MISS!', 'NOPE!', 'TRY AGAIN!', 'NOT QUITE!'],
  close: ['CLOSE!', 'ALMOST!', 'SO CLOSE!', 'JUST MISSED!'],
};

// Get random message
export function getRandomSuccess(): string {
  return SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
}

export function getRandomFail(type: 'miss' | 'close' = 'miss'): string {
  const messages = FAIL_MESSAGES[type];
  return messages[Math.floor(Math.random() * messages.length)];
}
