/**
 * AtmosphericBackground - Ambient visual effects for immersive environments
 * Dust motes, haze, light rays, animated crowds, dynamic stadium lights
 */

import { GAUNTLET_COLORS } from '../config/theme';

export interface DustMoteConfig {
  density?: number;
  color?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  depth?: number;
}

export interface HazeConfig {
  opacity?: number;
  color?: number;
  animated?: boolean;
  depth?: number;
}

export interface LightRayConfig {
  angle?: number;
  count?: number;
  color?: number;
  opacity?: number;
  width?: number;
  animated?: boolean;
  depth?: number;
}

export interface CrowdConfig {
  rows?: number;
  density?: number;
  animated?: boolean;
  flashFrequency?: number;
  waveEnabled?: boolean;
  depth?: number;
}

export interface DynamicLightConfig {
  count?: number;
  flickerIntensity?: number;
  beamSweep?: boolean;
  lensFlare?: boolean;
  depth?: number;
}

/**
 * Create floating dust motes that catch light
 * Adds depth and atmosphere to any scene
 */
export function createDustMotes(
  scene: Phaser.Scene,
  config: DustMoteConfig = {}
): { update: () => void; destroy: () => void } {
  const {
    density = 20,
    color = 0xffffee,
    minSize = 1,
    maxSize = 3,
    speed = 0.3,
    depth = 100
  } = config;

  const { width, height } = scene.cameras.main;
  const motes: Phaser.GameObjects.Arc[] = [];

  // Create initial motes
  for (let i = 0; i < density; i++) {
    const mote = scene.add.circle(
      Math.random() * width,
      Math.random() * height,
      minSize + Math.random() * (maxSize - minSize),
      color,
      0.3 + Math.random() * 0.4
    );
    mote.setDepth(depth);

    // Store movement data
    (mote as any).vx = (Math.random() - 0.5) * speed;
    (mote as any).vy = (Math.random() - 0.5) * speed * 0.5 - speed * 0.2; // Slight upward drift
    (mote as any).phase = Math.random() * Math.PI * 2;

    motes.push(mote);
  }

  const update = () => {
    motes.forEach(mote => {
      const data = mote as any;

      // Gentle floating motion
      data.phase += 0.02;
      mote.x += data.vx + Math.sin(data.phase) * 0.2;
      mote.y += data.vy + Math.cos(data.phase * 0.7) * 0.1;

      // Subtle pulsing
      mote.setAlpha(0.3 + Math.sin(data.phase * 2) * 0.2);

      // Wrap around screen
      if (mote.x < -10) mote.x = width + 10;
      if (mote.x > width + 10) mote.x = -10;
      if (mote.y < -10) mote.y = height + 10;
      if (mote.y > height + 10) mote.y = -10;
    });
  };

  const destroy = () => {
    motes.forEach(mote => mote.destroy());
  };

  return { update, destroy };
}

/**
 * Create subtle fog/haze layer
 * Adds depth and softens the background
 */
export function createHaze(
  scene: Phaser.Scene,
  config: HazeConfig = {}
): { update: () => void; destroy: () => void; setOpacity: (o: number) => void } {
  const {
    opacity = 0.1,
    color = 0x8899aa,
    animated = true,
    depth = 50
  } = config;

  const { width, height } = scene.cameras.main;

  const haze = scene.add.graphics();
  haze.setDepth(depth);
  haze.setAlpha(opacity);

  let phase = 0;
  let currentOpacity = opacity;

  const drawHaze = (alpha: number) => {
    haze.clear();

    // Multiple layers of soft gradients
    for (let i = 0; i < 3; i++) {
      const layerAlpha = alpha * (1 - i * 0.2);
      const yOffset = Math.sin(phase + i) * 20;

      // Horizontal gradient bands
      haze.fillStyle(color, layerAlpha);
      haze.fillRect(0, height * 0.3 + yOffset + i * 50, width, height * 0.2);
      haze.fillRect(0, height * 0.6 + yOffset + i * 30, width, height * 0.15);
    }
  };

  drawHaze(currentOpacity);

  const update = () => {
    if (!animated) return;

    phase += 0.01;
    const animatedAlpha = currentOpacity + Math.sin(phase) * 0.02;
    drawHaze(animatedAlpha);
  };

  const setOpacity = (o: number) => {
    currentOpacity = o;
    haze.setAlpha(o);
  };

  const destroy = () => {
    haze.destroy();
  };

  return { update, destroy, setOpacity };
}

/**
 * Create light rays through dust/haze
 * Dramatic volumetric lighting effect
 */
export function createLightRays(
  scene: Phaser.Scene,
  config: LightRayConfig = {}
): { update: () => void; destroy: () => void; setIntensity: (i: number) => void } {
  const {
    angle = -30,
    count = 3,
    color = GAUNTLET_COLORS.lightCone,
    opacity = 0.15,
    width: rayWidth = 100,
    animated = true,
    depth = 60
  } = config;

  const { width, height } = scene.cameras.main;
  const rays = scene.add.graphics();
  rays.setDepth(depth);

  let phase = 0;
  let intensity = 1;

  const drawRays = () => {
    rays.clear();

    const angleRad = (angle * Math.PI) / 180;

    for (let i = 0; i < count; i++) {
      const baseX = (width / (count + 1)) * (i + 1);
      const animOffset = animated ? Math.sin(phase + i * 0.5) * 30 : 0;
      const x = baseX + animOffset;

      // Calculate ray path
      const startY = -50;
      const endY = height + 50;
      const drift = Math.tan(angleRad) * (endY - startY);

      // Ray gradient (brighter at top)
      const rayOpacity = opacity * intensity * (animated ? (0.7 + Math.sin(phase * 2 + i) * 0.3) : 1);

      rays.fillStyle(color, rayOpacity * 0.3);

      // Draw as gradient polygon
      const points = [
        { x: x - rayWidth / 2, y: startY },
        { x: x + rayWidth / 2, y: startY },
        { x: x + rayWidth / 2 + drift, y: endY },
        { x: x - rayWidth / 2 + drift, y: endY }
      ];

      rays.beginPath();
      rays.moveTo(points[0].x, points[0].y);
      points.forEach(p => rays.lineTo(p.x, p.y));
      rays.closePath();
      rays.fillPath();

      // Brighter center line
      rays.fillStyle(color, rayOpacity * 0.6);
      const centerPoints = [
        { x: x - rayWidth / 4, y: startY },
        { x: x + rayWidth / 4, y: startY },
        { x: x + rayWidth / 4 + drift, y: endY },
        { x: x - rayWidth / 4 + drift, y: endY }
      ];

      rays.beginPath();
      rays.moveTo(centerPoints[0].x, centerPoints[0].y);
      centerPoints.forEach(p => rays.lineTo(p.x, p.y));
      rays.closePath();
      rays.fillPath();
    }
  };

  drawRays();

  const update = () => {
    if (!animated) return;
    phase += 0.008;
    drawRays();
  };

  const setIntensity = (i: number) => {
    intensity = i;
    drawRays();
  };

  const destroy = () => {
    rays.destroy();
  };

  return { update, destroy, setIntensity };
}

/**
 * Create animated crowd silhouettes
 * Stadium atmosphere with occasional movement and camera flashes
 */
export function createAnimatedCrowd(
  scene: Phaser.Scene,
  config: CrowdConfig = {}
): { update: () => void; destroy: () => void; triggerWave: () => void; triggerCheer: () => void } {
  const {
    rows = 5,
    density = 30,
    animated = true,
    flashFrequency = 3000,
    waveEnabled = true,
    depth = 10
  } = config;

  const { width, height } = scene.cameras.main;
  const crowdContainer = scene.add.container(0, 0);
  crowdContainer.setDepth(depth);

  interface CrowdMember {
    graphics: Phaser.GameObjects.Graphics;
    x: number;
    y: number;
    baseY: number;
    bobPhase: number;
    bobSpeed: number;
    height: number;
    isAnimating: boolean;
  }

  const members: CrowdMember[] = [];
  const flashes: Phaser.GameObjects.Arc[] = [];

  // Create crowd silhouettes
  const crowdBaseY = height * 0.15;
  const rowHeight = 25;

  for (let row = 0; row < rows; row++) {
    const y = crowdBaseY + row * rowHeight;
    const rowDensity = Math.floor(density * (1 - row * 0.1));

    for (let i = 0; i < rowDensity; i++) {
      const x = (width / rowDensity) * i + Math.random() * 20 - 10;
      const memberHeight = 20 + Math.random() * 15;

      const graphics = scene.add.graphics();

      // Draw silhouette (head + shoulders)
      const brightness = 0.1 + row * 0.05;
      const gray = Math.floor(brightness * 255);
      graphics.fillStyle(Phaser.Display.Color.GetColor(gray, gray, gray + 10), 1);

      // Body/shoulders
      graphics.fillRoundedRect(x - 8, y, 16, memberHeight * 0.7, 3);

      // Head
      graphics.fillCircle(x, y - 5, 6);

      crowdContainer.add(graphics);

      members.push({
        graphics,
        x,
        y,
        baseY: y,
        bobPhase: Math.random() * Math.PI * 2,
        bobSpeed: 0.02 + Math.random() * 0.02,
        height: memberHeight,
        isAnimating: false
      });
    }
  }

  // Camera flash effect
  const createFlash = () => {
    if (!animated) return;

    const flashX = Math.random() * width;
    const flashY = crowdBaseY + Math.random() * (rows * rowHeight);

    const flash = scene.add.circle(flashX, flashY, 3, 0xffffff, 1);
    flash.setDepth(depth + 1);
    flashes.push(flash);

    scene.tweens.add({
      targets: flash,
      radius: 20,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        const idx = flashes.indexOf(flash);
        if (idx > -1) flashes.splice(idx, 1);
        flash.destroy();
      }
    });
  };

  // Schedule random flashes
  let flashTimer: Phaser.Time.TimerEvent | null = null;
  if (animated && flashFrequency > 0) {
    flashTimer = scene.time.addEvent({
      delay: flashFrequency,
      callback: () => {
        if (Math.random() < 0.7) createFlash();
      },
      loop: true
    });
  }

  // Wave animation
  const triggerWave = () => {
    if (!waveEnabled) return;

    members.forEach((member, i) => {
      scene.time.delayedCall(i * 30, () => {
        member.isAnimating = true;

        scene.tweens.add({
          targets: member,
          y: member.baseY - 15,
          duration: 200,
          ease: 'Quad.easeOut',
          yoyo: true,
          onComplete: () => {
            member.isAnimating = false;
            member.y = member.baseY;
          }
        });
      });
    });
  };

  // Cheer animation (random members jump)
  const triggerCheer = () => {
    const cheerCount = Math.floor(members.length * 0.3);
    const shuffled = [...members].sort(() => Math.random() - 0.5);

    for (let i = 0; i < cheerCount; i++) {
      const member = shuffled[i];

      scene.time.delayedCall(Math.random() * 200, () => {
        member.isAnimating = true;

        scene.tweens.add({
          targets: member,
          y: member.baseY - 10 - Math.random() * 10,
          duration: 150 + Math.random() * 100,
          ease: 'Quad.easeOut',
          yoyo: true,
          onComplete: () => {
            member.isAnimating = false;
            member.y = member.baseY;
          }
        });
      });
    }

    // Multiple flashes during cheer
    for (let i = 0; i < 5; i++) {
      scene.time.delayedCall(i * 100, createFlash);
    }
  };

  const update = () => {
    if (!animated) return;

    members.forEach(member => {
      if (member.isAnimating) return;

      // Subtle idle bob
      member.bobPhase += member.bobSpeed;
      const bobY = Math.sin(member.bobPhase) * 2;

      // Redraw at new position
      member.graphics.clear();
      const y = member.baseY + bobY;

      const brightness = 0.1 + (member.baseY - crowdBaseY) / (rows * rowHeight) * 0.15;
      const gray = Math.floor(brightness * 255);
      member.graphics.fillStyle(Phaser.Display.Color.GetColor(gray, gray, gray + 10), 1);

      member.graphics.fillRoundedRect(member.x - 8, y, 16, member.height * 0.7, 3);
      member.graphics.fillCircle(member.x, y - 5, 6);
    });
  };

  const destroy = () => {
    if (flashTimer) flashTimer.remove();
    crowdContainer.destroy(true);
    flashes.forEach(f => f.destroy());
  };

  return { update, destroy, triggerWave, triggerCheer };
}

/**
 * Create dynamic stadium lights
 * Flickering lights, lens flares, and beam sweeps
 */
export function createDynamicLights(
  scene: Phaser.Scene,
  config: DynamicLightConfig = {}
): { update: () => void; destroy: () => void; setIntensity: (i: number) => void; flash: () => void } {
  const {
    count = 4,
    flickerIntensity = 0.1,
    beamSweep = false,
    lensFlare = true,
    depth = 80
  } = config;

  const { width, height } = scene.cameras.main;
  const lightsContainer = scene.add.container(0, 0);
  lightsContainer.setDepth(depth);

  interface Light {
    x: number;
    y: number;
    glow: Phaser.GameObjects.Arc;
    flare?: Phaser.GameObjects.Graphics;
    beam?: Phaser.GameObjects.Graphics;
    baseAlpha: number;
    flickerPhase: number;
  }

  const lights: Light[] = [];
  let globalIntensity = 1;

  // Create lights across top of screen
  for (let i = 0; i < count; i++) {
    const x = (width / (count + 1)) * (i + 1);
    const y = 30;

    // Main glow
    const glow = scene.add.circle(x, y, 15, GAUNTLET_COLORS.lightCone, 0.9);
    lightsContainer.add(glow);

    // Outer glow
    const outerGlow = scene.add.circle(x, y, 40, GAUNTLET_COLORS.lightCone, 0.2);
    lightsContainer.add(outerGlow);

    const light: Light = {
      x,
      y,
      glow,
      baseAlpha: 0.9,
      flickerPhase: Math.random() * Math.PI * 2
    };

    // Lens flare
    if (lensFlare) {
      const flare = scene.add.graphics();
      flare.fillStyle(0xffffff, 0.3);

      // Horizontal flare
      flare.fillRect(x - 60, y - 2, 120, 4);
      // Vertical flare
      flare.fillRect(x - 2, y - 30, 4, 60);
      // Diagonal flares
      flare.lineStyle(2, 0xffffff, 0.2);
      flare.lineBetween(x - 40, y - 40, x + 40, y + 40);
      flare.lineBetween(x + 40, y - 40, x - 40, y + 40);

      lightsContainer.add(flare);
      light.flare = flare;
    }

    // Light beam (cone)
    if (beamSweep) {
      const beam = scene.add.graphics();
      beam.fillStyle(GAUNTLET_COLORS.lightCone, 0.05);

      // Draw cone
      beam.beginPath();
      beam.moveTo(x, y);
      beam.lineTo(x - 150, height);
      beam.lineTo(x + 150, height);
      beam.closePath();
      beam.fillPath();

      lightsContainer.add(beam);
      light.beam = beam;
    }

    lights.push(light);
  }

  let sweepPhase = 0;

  const update = () => {
    lights.forEach(light => {
      // Flicker effect
      light.flickerPhase += 0.1 + Math.random() * 0.05;
      const flicker = 1 - Math.random() * flickerIntensity;
      const alpha = light.baseAlpha * flicker * globalIntensity;

      light.glow.setAlpha(alpha);

      if (light.flare) {
        light.flare.setAlpha(alpha * 0.5);
      }
    });

    // Beam sweep (if enabled)
    if (beamSweep) {
      sweepPhase += 0.005;
      lights.forEach((light, i) => {
        if (light.beam) {
          const sweepAngle = Math.sin(sweepPhase + i * 0.5) * 0.3;
          light.beam.setRotation(sweepAngle);
        }
      });
    }
  };

  const setIntensity = (i: number) => {
    globalIntensity = i;
  };

  const flash = () => {
    // All lights flash bright
    lights.forEach(light => {
      const originalAlpha = light.glow.alpha;

      scene.tweens.add({
        targets: light.glow,
        alpha: 1,
        duration: 50,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          light.glow.setAlpha(originalAlpha);
        }
      });
    });
  };

  const destroy = () => {
    lightsContainer.destroy(true);
  };

  return { update, destroy, setIntensity, flash };
}

/**
 * Create a complete atmospheric environment
 * Combines multiple effects for rich atmosphere
 */
export function createAtmosphere(
  scene: Phaser.Scene,
  preset: 'stadium' | 'studio' | 'dramatic' | 'celebration' = 'stadium'
): { update: () => void; destroy: () => void } {
  const effects: { update: () => void; destroy: () => void }[] = [];

  switch (preset) {
    case 'stadium':
      effects.push(createDustMotes(scene, { density: 15, color: 0xffffdd, speed: 0.2 }));
      effects.push(createHaze(scene, { opacity: 0.08, color: 0x6688aa }));
      effects.push(createAnimatedCrowd(scene, { rows: 4, flashFrequency: 4000 }));
      effects.push(createDynamicLights(scene, { count: 3, flickerIntensity: 0.05 }));
      break;

    case 'studio':
      effects.push(createDustMotes(scene, { density: 10, color: 0xffeedd, speed: 0.15 }));
      effects.push(createLightRays(scene, { count: 2, opacity: 0.1, angle: -20 }));
      effects.push(createDynamicLights(scene, { count: 5, flickerIntensity: 0.03, lensFlare: true }));
      break;

    case 'dramatic':
      effects.push(createHaze(scene, { opacity: 0.15, color: 0x445566 }));
      effects.push(createLightRays(scene, { count: 4, opacity: 0.2, angle: -35 }));
      effects.push(createDynamicLights(scene, { count: 4, flickerIntensity: 0.15, beamSweep: true }));
      break;

    case 'celebration':
      effects.push(createDustMotes(scene, { density: 30, color: 0xffd700, speed: 0.4 }));
      effects.push(createAnimatedCrowd(scene, { rows: 5, flashFrequency: 1000, waveEnabled: true }));
      effects.push(createDynamicLights(scene, { count: 6, flickerIntensity: 0.2 }));
      break;
  }

  const update = () => {
    effects.forEach(e => e.update());
  };

  const destroy = () => {
    effects.forEach(e => e.destroy());
  };

  return { update, destroy };
}

export const AtmosphericBackground = {
  createDustMotes,
  createHaze,
  createLightRays,
  createAnimatedCrowd,
  createDynamicLights,
  createAtmosphere
};

export default AtmosphericBackground;
