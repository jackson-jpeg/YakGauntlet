// The Yak Gauntlet - Unified Theme & Branding
// Consistent colors, fonts, and styling across all scenes
// Based on The Yak show's vibrant, energetic aesthetic

// Gauntlet Industrial Theme Colors
export const GAUNTLET_COLORS = {
  bgDark: 0x1a1a1a,           // Concrete dark
  bgMedium: 0x2d2d2d,         // Industrial gray
  bgLight: 0x404040,          // Lighter gray
  timerRed: 0xff3333,         // Anxiety-inducing timer red
  timerOrange: 0xff6600,      // Warning orange
  timerYellow: 0xffcc00,      // Caution yellow
  timerWhite: 0xffffff,       // Normal timer
  boardWood: 0x8b5a2b,        // Worn wood brown
  bagRed: 0xcc0000,           // Classic cornhole red bag
  bagBlue: 0x0044cc,          // Classic cornhole blue bag
  metalGray: 0x808080,        // Metal truss/fixtures
  lightCone: 0xffffee,        // Studio light color
};

export const YAK_COLORS = {
  // Primary Yak brand colors (from show branding)
  primary: 0xff5722,        // Yak Orange-Red - main brand color
  primaryBright: 0xff6b35,  // Bright orange for emphasis
  primaryDark: 0xe64a19,    // Darker orange-red

  // Secondary brand colors
  secondary: 0xffc107,      // Bright Gold/Yellow - highlights & accents
  secondaryDark: 0xf57c00,  // Darker gold/amber

  // Yak Navy (from jerseys/branding)
  navy: 0x1e3a5f,           // Dark blue accent
  navyDark: 0x0f1d30,       // Darker navy

  // Success/Energy colors
  success: 0x4caf50,        // Bright green - goals, hits, success
  successBright: 0x66bb6a,  // Lighter green for emphasis
  energy: 0xff9800,         // Energetic orange

  // UI states
  warning: 0xffca28,        // Bright yellow - caution
  danger: 0xf44336,         // Bright red - misses, failures

  // Background colors - vibrant Yak style
  bgDark: 0x0f1419,         // Almost black
  bgMedium: 0x1a2332,       // Dark blue-grey
  bgLight: 0x2a3f5f,        // Lighter blue accent
  bgCream: 0xf5e6d3,        // Vintage cream (from graphics)

  // Vibrant accent colors (from show graphics)
  vibrantRed: 0xe53935,
  vibrantOrange: 0xff6f00,
  vibrantYellow: 0xfdd835,
  vibrantGreen: 0x43a047,
  vibrantBlue: 0x1e88e5,
  vibrantPurple: 0x8e24aa,

  // Text colors (as hex strings for Phaser text)
  textWhite: '#ffffff',
  textCream: '#f5e6d3',
  textGold: '#ffc107',
  textOrange: '#ff6b35',
  textGreen: '#66bb6a',
  textRed: '#f44336',
  textNavy: '#1e3a5f',
  textGray: '#9ca3af',

  // Misc
  white: 0xffffff,
  black: 0x000000,

  // Stool/Icon colors
  stoolBrown: 0x8b4513,
  stoolDark: 0x654321,
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

// Station definitions with display info - vibrant Yak colors
export const STATIONS = [
  { id: 'cornhole', name: 'CORNHOLE', color: 0xe53935, emoji: '🎯' },      // Vibrant red
  { id: 'goalie', name: 'PENALTY', color: 0x43a047, emoji: '⚽' },         // Vibrant green
  { id: 'wiffle', name: 'WIFFLE', color: 0xfdd835, emoji: '🏏' },         // Vibrant yellow
  { id: 'football', name: 'FOOTBALL', color: 0xff6f00, emoji: '🏈' },     // Vibrant orange
  { id: 'corner3_right', name: '3PT RIGHT', color: 0xff5722, emoji: '🏀' }, // Yak orange-red
  { id: 'corner3_left', name: '3PT LEFT', color: 0xff5722, emoji: '🏀' },  // Yak orange-red
  { id: 'quiz', name: 'QUIZ', color: 0x8e24aa, emoji: '🧠' },             // Vibrant purple
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

/**
 * Get power meter color based on percentage (0-100 or 0-1)
 * Standardized thresholds: >80% danger, >50% warning, else success
 */
export function getPowerColor(powerPercent: number): number {
  // Normalize to 0-100 if given as decimal
  const percent = powerPercent > 1 ? powerPercent : powerPercent * 100;

  if (percent > 80) return YAK_COLORS.danger;
  if (percent > 50) return YAK_COLORS.warning;
  return YAK_COLORS.success;
}

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

/**
 * Create a stool icon (signature Yak element)
 * Returns a container with the stool graphic
 */
export function createStoolIcon(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale: number = 1
): Phaser.GameObjects.Container {
  const stool = scene.add.container(x, y);

  // Stool legs
  const legWidth = 3 * scale;
  const legHeight = 20 * scale;
  const legSpacing = 12 * scale;

  const leftLeg = scene.add.rectangle(-legSpacing, 0, legWidth, legHeight, YAK_COLORS.stoolDark);
  const rightLeg = scene.add.rectangle(legSpacing, 0, legWidth, legHeight, YAK_COLORS.stoolDark);

  // Stool seat (ellipse)
  const seat = scene.add.ellipse(0, -legHeight / 2 - 3 * scale, 18 * scale, 6 * scale, YAK_COLORS.stoolBrown);
  seat.setStrokeStyle(2 * scale, YAK_COLORS.stoolDark);

  // Cross bar
  const crossBar = scene.add.rectangle(0, legHeight / 4, 24 * scale, 2 * scale, YAK_COLORS.stoolDark);

  stool.add([leftLeg, rightLeg, crossBar, seat]);
  return stool;
}

/**
 * Create vibrant striped background (Yak aesthetic)
 */
export function createStripedBackground(
  scene: Phaser.Scene,
  width: number,
  height: number,
  colors: number[] = [YAK_COLORS.vibrantRed, YAK_COLORS.vibrantOrange, YAK_COLORS.vibrantYellow, YAK_COLORS.vibrantGreen]
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();
  const stripeHeight = height / colors.length;

  colors.forEach((color, i) => {
    graphics.fillStyle(color, 0.8);
    graphics.fillRect(0, i * stripeHeight, width, stripeHeight);
  });

  return graphics;
}

/**
 * Create textured/distressed text effect (Yak branding style)
 */
export function createDistressedText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);

  // Create multiple slightly offset text layers for texture
  const offsets = [
    { x: -2, y: -1, alpha: 0.3 },
    { x: 1, y: 2, alpha: 0.2 },
    { x: 0, y: 0, alpha: 1 },
  ];

  offsets.forEach((offset, i) => {
    const textObj = scene.add.text(offset.x, offset.y, text, {
      ...style,
      color: i === offsets.length - 1 ? style.color : '#000000',
    }).setOrigin(0.5).setAlpha(offset.alpha);
    container.add(textObj);
  });

  return container;
}
