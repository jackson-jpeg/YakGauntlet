import Phaser from 'phaser';
import type { CharacterId } from '../types';
import { YAK_COLORS } from '../config/theme';

/**
 * Character Sprite Generator
 * Creates pixel art style character representations
 */

export interface CharacterSpriteConfig {
  color: number;
  hairColor: number;
  hairStyle: 'short' | 'long' | 'curly' | 'none';
  hasBeard?: boolean;
  hasGlasses?: boolean;
  hasHat?: boolean;
  hatColor?: number;
}

const CHARACTER_CONFIGS: Record<CharacterId, CharacterSpriteConfig> = {
  BIG_CAT: {
    color: 0xffdbac,
    hairColor: 0x4a3728,
    hairStyle: 'short',
    hasGlasses: true,
  },
  BRANDON_WALKER: {
    color: 0xffdbac,
    hairColor: 0x2c1810,
    hairStyle: 'short',
    hasBeard: true,
  },
  KB: {
    color: 0xd4a574,
    hairColor: 0x1a1a1a,
    hairStyle: 'short',
  },
  NICK_TURANI: {
    color: 0xffdbac,
    hairColor: 0x4a3728,
    hairStyle: 'short',
  },
  KATE: {
    color: 0xffdbac,
    hairColor: 0x8b4513,
    hairStyle: 'long',
  },
  ZAH: {
    color: 0xd4a574,
    hairColor: 0x1a1a1a,
    hairStyle: 'short',
  },
  STEVEN_CHEAH: {
    color: 0xffdbac,
    hairColor: 0x2c1810,
    hairStyle: 'short',
  },
  DANNY_CONRAD: {
    color: 0xffdbac,
    hairColor: 0x4a3728,
    hairStyle: 'short',
    hasHat: true,
    hatColor: YAK_COLORS.primary,
  },
  MARK_TITUS: {
    color: 0xffdbac,
    hairColor: 0x4a3728,
    hairStyle: 'short',
  },
  TJ: {
    color: 0xffdbac,
    hairColor: 0x2c1810,
    hairStyle: 'short',
  },
};

/**
 * Create a pixel art character sprite
 */
export function createCharacterSprite(
  scene: Phaser.Scene,
  characterId: CharacterId,
  x: number,
  y: number,
  scale: number = 1
): Phaser.GameObjects.Container {
  const config = CHARACTER_CONFIGS[characterId];
  const container = scene.add.container(x, y);
  container.setScale(scale);

  // Body (jersey)
  const body = scene.add.rectangle(0, 15, 32, 40, YAK_COLORS.primary);
  body.setStrokeStyle(2, YAK_COLORS.primaryDark);
  container.add(body);

  // Head
  const head = scene.add.circle(0, -8, 14, config.color);
  head.setStrokeStyle(2, 0xe6c89c);
  container.add(head);

  // Hair
  if (config.hairStyle !== 'none') {
    if (config.hairStyle === 'short') {
      const hair = scene.add.ellipse(0, -18, 24, 12, config.hairColor);
      container.add(hair);
    } else if (config.hairStyle === 'long') {
      const hair = scene.add.ellipse(0, -18, 24, 16, config.hairColor);
      container.add(hair);
      // Hair sides
      scene.add.ellipse(-10, -10, 8, 12, config.hairColor);
      scene.add.ellipse(10, -10, 8, 12, config.hairColor);
    } else if (config.hairStyle === 'curly') {
      for (let i = 0; i < 5; i++) {
        const curl = scene.add.circle(-8 + i * 4, -18, 4, config.hairColor);
        container.add(curl);
      }
    }
  }

  // Beard
  if (config.hasBeard) {
    const beard = scene.add.ellipse(0, -2, 16, 10, config.hairColor);
    container.add(beard);
  }

  // Glasses
  if (config.hasGlasses) {
    const glasses = scene.add.graphics();
    glasses.fillStyle(0x1a1a1a, 0.8);
    glasses.fillRect(-10, -12, 8, 6);
    glasses.fillRect(2, -12, 8, 6);
    glasses.lineStyle(2, 0x1a1a1a, 1);
    glasses.moveTo(-2, -12);
    glasses.lineTo(2, -12);
    container.add(glasses);
  }

  // Hat
  if (config.hasHat) {
    const hatColor = config.hatColor || 0x1a1a1a;
    const hat = scene.add.ellipse(0, -22, 20, 8, hatColor);
    container.add(hat);
    const hatTop = scene.add.rectangle(0, -26, 18, 6, hatColor);
    container.add(hatTop);
  }

  // Eyes
  const leftEye = scene.add.circle(-4, -10, 2, 0x1a1a1a);
  const rightEye = scene.add.circle(4, -10, 2, 0x1a1a1a);
  container.add([leftEye, rightEye]);

  // Mouth
  const mouth = scene.add.graphics();
  mouth.lineStyle(2, 0x1a1a1a, 1);
  mouth.beginPath();
  mouth.arc(0, -6, 4, 0.2, Math.PI - 0.2, false);
  mouth.strokePath();
  container.add(mouth);

  // Jersey number (random for variety)
  const number = scene.add.text(0, 15, Math.floor(Math.random() * 99).toString(), {
    fontSize: '12px',
    fontFamily: 'Arial Black',
    color: '#ffffff',
  }).setOrigin(0.5);
  container.add(number);

  return container;
}

/**
 * Create a goalie sprite with character customization
 */
export function createGoalieSprite(
  scene: Phaser.Scene,
  characterId: CharacterId,
  x: number,
  y: number
): Phaser.GameObjects.Container {
  const config = CHARACTER_CONFIGS[characterId];
  const container = scene.add.container(x, y);
  container.setDepth(20);

  // Shadow
  const shadow = scene.add.ellipse(0, 55, 60, 20, 0x000000, 0.3);
  container.add(shadow);

  // Legs
  const leftLeg = scene.add.rectangle(-10, 40, 16, 40, 0x1a1a1a);
  const rightLeg = scene.add.rectangle(10, 40, 16, 40, 0x1a1a1a);
  container.add([leftLeg, rightLeg]);

  // Shorts
  const shorts = scene.add.rectangle(0, 22, 36, 24, 0x1a1a1a);
  container.add(shorts);

  // Jersey - Yak gold with character color accent
  const jersey = scene.add.rectangle(0, -5, 50, 50, YAK_COLORS.secondary);
  jersey.setStrokeStyle(2, YAK_COLORS.secondaryDark);
  container.add(jersey);

  // Jersey detail
  const jerseyDetail = scene.add.graphics();
  jerseyDetail.fillStyle(0x000000, 0.2);
  jerseyDetail.fillRect(-25, -30, 50, 10);
  container.add(jerseyDetail);

  // Number (based on character)
  const number = scene.add.text(0, -5, getCharacterNumber(characterId), {
    fontSize: '28px',
    fontFamily: 'Arial Black',
    color: '#1a1a1a',
  }).setOrigin(0.5);
  container.add(number);

  // Arms
  const leftArm = scene.add.rectangle(-35, -5, 22, 45, YAK_COLORS.secondary);
  leftArm.setStrokeStyle(2, YAK_COLORS.secondaryDark);
  leftArm.setAngle(-15);
  const rightArm = scene.add.rectangle(35, -5, 22, 45, YAK_COLORS.secondary);
  rightArm.setStrokeStyle(2, YAK_COLORS.secondaryDark);
  rightArm.setAngle(15);
  container.add([leftArm, rightArm]);

  // Gloves - Yak red
  const leftGlove = scene.add.rectangle(-42, -28, 20, 22, YAK_COLORS.primary);
  leftGlove.setStrokeStyle(2, YAK_COLORS.primaryDark);
  const rightGlove = scene.add.rectangle(42, -28, 20, 22, YAK_COLORS.primary);
  rightGlove.setStrokeStyle(2, YAK_COLORS.primaryDark);
  container.add([leftGlove, rightGlove]);

  // Head with character features
  const head = scene.add.circle(0, -42, 18, config.color);
  head.setStrokeStyle(2, 0xe6c89c);
  container.add(head);

  // Hair
  if (config.hairStyle !== 'none') {
    if (config.hairStyle === 'short') {
      const hair = scene.add.ellipse(0, -52, 30, 16, config.hairColor);
      container.add(hair);
    } else if (config.hairStyle === 'long') {
      const hair = scene.add.ellipse(0, -52, 30, 20, config.hairColor);
      container.add(hair);
    }
  }

  // Beard
  if (config.hasBeard) {
    const beard = scene.add.ellipse(0, -38, 20, 12, config.hairColor);
    container.add(beard);
  }

  // Glasses (Big Cat special)
  if (config.hasGlasses) {
    const glasses = scene.add.graphics();
    glasses.fillStyle(0x1a1a1a, 0.7);
    glasses.fillRect(-8, -46, 6, 5);
    glasses.fillRect(2, -46, 6, 5);
    glasses.lineStyle(2, 0x1a1a1a, 1);
    glasses.moveTo(-2, -46);
    glasses.lineTo(2, -46);
    container.add(glasses);
  }

  // Face
  const face = scene.add.graphics();
  face.fillStyle(0x1a1a1a, 1);
  face.fillCircle(-6, -44, 2);
  face.fillCircle(6, -44, 2);
  face.lineStyle(2, 0x1a1a1a, 1);
  face.beginPath();
  face.arc(0, -38, 6, 0.2, Math.PI - 0.2, false);
  face.strokePath();
  container.add(face);

  return container;
}

function getCharacterNumber(characterId: CharacterId): string {
  // Assign numbers based on character
  const numbers: Record<CharacterId, string> = {
    BIG_CAT: '1',
    BRANDON_WALKER: '2',
    KB: '3',
    NICK_TURANI: '4',
    KATE: '5',
    ZAH: '6',
    STEVEN_CHEAH: '7',
    DANNY_CONRAD: '8',
    MARK_TITUS: '9',
    TJ: '10',
  };
  return numbers[characterId] || '?';
}
