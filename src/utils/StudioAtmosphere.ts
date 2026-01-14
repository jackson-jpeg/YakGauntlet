import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS } from '../config/theme';

/**
 * Studio Atmosphere Utilities
 * Adds Yak studio vibes to scenes
 */

/**
 * Create studio background with parquet floor
 */
export function createStudioBackground(scene: Phaser.Scene): void {
  // Dark studio background
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f0f1e, 0x000000, 1);
  bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Parquet floor (bottom portion)
  const floorGraphics = scene.add.graphics();
  floorGraphics.lineStyle(2, 0x2a2a2a, 0.4);
  
  const tileSize = 60;
  const floorStartY = GAME_HEIGHT * 0.6;
  
  for (let x = -GAME_WIDTH; x < GAME_WIDTH * 2; x += tileSize) {
    for (let y = floorStartY; y < GAME_HEIGHT * 2; y += tileSize) {
      if ((Math.floor(x/tileSize) + Math.floor(y/tileSize)) % 2 === 0) {
        floorGraphics.lineBetween(x, y, x + tileSize, y + tileSize);
      } else {
        floorGraphics.lineBetween(x + tileSize, y, x, y + tileSize);
      }
    }
  }

  // Floor shine
  const floorShine = scene.add.graphics();
  floorShine.fillGradientStyle(0xffffff, 0xffffff, 0x000000, 0x000000, 1);
  floorShine.fillRect(0, floorStartY, GAME_WIDTH, GAME_HEIGHT * 0.4);
  floorShine.setAlpha(0.05);
}

/**
 * Create studio lighting effects
 */
export function createStudioLights(scene: Phaser.Scene, count: number = 3): Phaser.GameObjects.GameObject[] {
  const lights: Phaser.GameObjects.GameObject[] = [];
  
  for (let i = 0; i < count; i++) {
    const x = 80 + i * (GAME_WIDTH - 160) / (count - 1 || 1);
    const y = 60;

    // Light fixture
    const fixture = scene.add.rectangle(x, y, 40, 15, 0x2a2a2a);
    fixture.setStrokeStyle(2, 0x3a3a3a);
    lights.push(fixture);

    // Light glow
    const glow = scene.add.circle(x, y, 25, 0xfef3c7, 0.3);
    scene.tweens.add({
      targets: glow,
      alpha: 0.5,
      scale: 1.2,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    lights.push(glow);

    // Light beam
    const beam = scene.add.graphics();
    beam.fillStyle(0xfef3c7, 0.1);
    beam.fillTriangle(x - 30, y + 10, x + 30, y + 10, x, GAME_HEIGHT * 0.6);
    lights.push(beam);
  }

  return lights;
}

/**
 * Create crowd/audience silhouettes
 */
export function createCrowdSilhouettes(scene: Phaser.Scene): Phaser.GameObjects.Container[] {
  const crowd: Phaser.GameObjects.Container[] = [];
  
  // Create rows of audience silhouettes
  for (let row = 0; row < 3; row++) {
    const y = 100 + row * 40;
    const count = 6 + row * 2;
    
    for (let i = 0; i < count; i++) {
      const x = (GAME_WIDTH / (count + 1)) * (i + 1);
      const person = scene.add.container(x, y);
      
      // Head
      const head = scene.add.circle(0, 0, 8, 0x1a1a1a);
      person.add(head);
      
      // Body
      const body = scene.add.rectangle(0, 10, 12, 20, 0x1a1a1a);
      person.add(body);
      
      person.setAlpha(0.4);
      person.setScale(0.8 + row * 0.1);
      
      // Subtle animation
      scene.tweens.add({
        targets: person,
        y: y + Math.sin(i) * 2,
        duration: 2000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      
      crowd.push(person);
    }
  }
  
  return crowd;
}

/**
 * Create scoreboard/display board
 */
export function createScoreboard(
  scene: Phaser.Scene,
  x: number,
  y: number,
  title: string
): Phaser.GameObjects.Container {
  const board = scene.add.container(x, y);
  
  // Background
  const bg = scene.add.graphics();
  bg.fillStyle(0x1a1a1a, 0.9);
  bg.fillRoundedRect(-80, -30, 160, 60, 8);
  bg.lineStyle(2, YAK_COLORS.secondary, 0.8);
  bg.strokeRoundedRect(-80, -30, 160, 60, 8);
  board.add(bg);
  
  // Title
  const titleText = scene.add.text(0, -10, title, {
    fontSize: '14px',
    fontFamily: 'Arial Black',
    color: YAK_COLORS.secondary,
  }).setOrigin(0.5);
  board.add(titleText);
  
  // Glow effect
  scene.tweens.add({
    targets: bg,
    alpha: 0.95,
    duration: 1500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  
  return board;
}

/**
 * Create arena/stadium atmosphere
 */
export function createArenaAtmosphere(scene: Phaser.Scene): void {
  // Stadium seating background
  const seating = scene.add.graphics();
  seating.fillGradientStyle(0x2a2a2a, 0x1a1a1a, 0x0a0a0a, 0x000000, 1);
  seating.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.4);
  
  // Stadium lines
  const lines = scene.add.graphics();
  lines.lineStyle(1, 0x3a3a3a, 0.3);
  for (let i = 0; i < 5; i++) {
    const y = (GAME_HEIGHT * 0.4 / 5) * i;
    lines.moveTo(0, y);
    lines.lineTo(GAME_WIDTH, y);
  }
  lines.strokePath();
  
  // Crowd noise indicator (subtle)
  const noiseIndicator = scene.add.graphics();
  noiseIndicator.fillStyle(0x4ade80, 0.2);
  noiseIndicator.fillRect(GAME_WIDTH - 100, 20, 80, 10);
  noiseIndicator.setDepth(100);
  
  // Pulse animation for crowd energy
  scene.tweens.add({
    targets: noiseIndicator,
    alpha: 0.4,
    scaleX: 1.1,
    duration: 1000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}
