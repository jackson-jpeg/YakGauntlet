import Phaser from 'phaser';

/**
 * ProceduralTextureFactory
 *
 * High-fidelity texture generation at runtime using Phaser Graphics API.
 * Creates realistic materials without external image files.
 */
export class ProceduralTextureFactory {
  private scene: Phaser.Scene;
  private textures: Map<string, string> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Creates a realistic hardwood basketball court floor
   * with wood grain, glossy finish, and court lines
   */
  createHardwoodCourt(width: number, height: number, key: string = 'hardwood_court'): string {
    if (this.textures.has(key)) {
      return this.textures.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Base wood color (maple hardwood)
    const baseColor = '#d4a574';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    // Wood grain using noise
    this.drawWoodGrain(ctx, width, height, '#c89968', '#e0b888');

    // Glossy highlights
    this.drawGlossyHighlights(ctx, width, height);

    // Court lines (subtle)
    this.drawCourtLines(ctx, width, height);

    // Vignette for depth
    this.drawVignette(ctx, width, height, 0.15);

    // Convert to texture
    this.scene.textures.addCanvas(key, canvas);
    this.textures.set(key, key);
    return key;
  }

  /**
   * Creates a fabric beanbag with realistic stitching
   */
  createBeanbag(radius: number, color: number, key?: string): string {
    const textureKey = key || `beanbag_${color}_${radius}`;
    if (this.textures.has(textureKey)) {
      return this.textures.get(textureKey)!;
    }

    const size = radius * 2 + 20;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const centerX = size / 2;
    const centerY = size / 2;

    // Convert hex color to RGB
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;

    // Create gradient for 3D effect
    const gradient = ctx.createRadialGradient(
      centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, `rgba(${r + 40}, ${g + 40}, ${b + 40}, 1)`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 1)`);
    gradient.addColorStop(1, `rgba(${r - 30}, ${g - 30}, ${b - 30}, 1)`);

    // Draw main bag
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Fabric texture (cross-hatch pattern)
    ctx.strokeStyle = `rgba(${r - 50}, ${g - 50}, ${b - 50}, 0.2)`;
    ctx.lineWidth = 1;
    for (let i = -radius; i < radius; i += 3) {
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY + i);
      ctx.lineTo(centerX + radius, centerY + i);
      ctx.stroke();

      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(centerX + i, centerY - radius);
      ctx.lineTo(centerX + i, centerY + radius);
      ctx.stroke();
    }

    // Stitching around the edge
    ctx.strokeStyle = `rgba(${r - 80}, ${g - 80}, ${b - 80}, 0.8)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner stitching details
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x1 = centerX + Math.cos(angle) * (radius * 0.3);
      const y1 = centerY + Math.sin(angle) * (radius * 0.3);
      const x2 = centerX + Math.cos(angle) * (radius * 0.6);
      const y2 = centerY + Math.sin(angle) * (radius * 0.6);

      ctx.strokeStyle = `rgba(${r - 60}, ${g - 60}, ${b - 60}, 0.4)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Specular highlight
    const specular = ctx.createRadialGradient(
      centerX - radius * 0.4, centerY - radius * 0.4, 0,
      centerX - radius * 0.4, centerY - radius * 0.4, radius * 0.5
    );
    specular.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    specular.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = specular;
    ctx.fillRect(0, 0, size, size);

    this.scene.textures.addCanvas(textureKey, canvas);
    this.textures.set(textureKey, textureKey);
    return textureKey;
  }

  /**
   * Creates a wooden cornhole board with realistic wood texture and deep hole
   */
  createCornholeBoard(width: number, height: number, key: string = 'cornhole_board'): string {
    if (this.textures.has(key)) {
      return this.textures.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Wood base color (painted board - traditional blue/red, let's do dark stained wood)
    const woodColor = '#8b6f47';
    ctx.fillStyle = woodColor;
    ctx.fillRect(0, 0, width, height);

    // Wood grain
    this.drawWoodGrain(ctx, width, height, '#6b5437', '#ab8f67', 'horizontal');

    // Board frame (raised edge)
    ctx.strokeStyle = '#5a4428';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // Inner shadow for depth
    ctx.strokeStyle = '#3a2818';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Highlight on edges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // The hole (top center)
    const holeX = width / 2;
    const holeY = height * 0.25;
    const holeRadius = width * 0.13;

    // Deep shadow for hole
    const holeShadow = ctx.createRadialGradient(
      holeX, holeY, holeRadius * 0.3,
      holeX, holeY, holeRadius
    );
    holeShadow.addColorStop(0, '#000000');
    holeShadow.addColorStop(0.7, '#1a1a1a');
    holeShadow.addColorStop(1, '#3a2818');

    ctx.fillStyle = holeShadow;
    ctx.beginPath();
    ctx.arc(holeX, holeY, holeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Hole edge ring (worn wood)
    ctx.strokeStyle = '#2a1808';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(holeX, holeY, holeRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner hole ring
    ctx.strokeStyle = '#1a1008';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(holeX, holeY, holeRadius - 3, 0, Math.PI * 2);
    ctx.stroke();

    // Scuff marks and wear
    for (let i = 0; i < 15; i++) {
      const scuffX = Math.random() * width;
      const scuffY = Math.random() * height;
      const scuffLength = Math.random() * 30 + 10;
      const scuffAngle = Math.random() * Math.PI * 2;

      ctx.strokeStyle = `rgba(50, 35, 20, ${Math.random() * 0.3})`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(scuffX, scuffY);
      ctx.lineTo(
        scuffX + Math.cos(scuffAngle) * scuffLength,
        scuffY + Math.sin(scuffAngle) * scuffLength
      );
      ctx.stroke();
    }

    this.scene.textures.addCanvas(key, canvas);
    this.textures.set(key, key);
    return key;
  }

  /**
   * Creates an industrial concrete floor texture for Gauntlet style
   */
  createConcreteFloor(width: number, height: number, key: string = 'concrete_floor'): string {
    if (this.textures.has(key)) {
      return this.textures.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Base concrete color (dark gray)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, width, height);

    // Add noise/texture
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2 + 0.5;
      const brightness = Math.random() * 30 + 25;
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.fillRect(x, y, size, size);
    }

    // Add subtle variation patches
    for (let i = 0; i < 20; i++) {
      const patchX = Math.random() * width;
      const patchY = Math.random() * height;
      const patchRadius = Math.random() * 100 + 50;
      const gradient = ctx.createRadialGradient(patchX, patchY, 0, patchX, patchY, patchRadius);
      const brightness = Math.random() > 0.5 ? 50 : 35;
      gradient.addColorStop(0, `rgba(${brightness}, ${brightness}, ${brightness}, 0.3)`);
      gradient.addColorStop(1, 'rgba(42, 42, 42, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(patchX - patchRadius, patchY - patchRadius, patchRadius * 2, patchRadius * 2);
    }

    // Expansion joint lines (concrete seams)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 3;

    // Horizontal lines
    const hSpacing = height / 4;
    for (let y = hSpacing; y < height; y += hSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines
    const vSpacing = width / 3;
    for (let x = vSpacing; x < width; x += vSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Add crack details
    ctx.strokeStyle = '#1f1f1f';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      let x = startX;
      let y = startY;
      for (let j = 0; j < 5; j++) {
        x += (Math.random() - 0.5) * 40;
        y += Math.random() * 30;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Vignette for depth
    this.drawVignette(ctx, width, height, 0.4);

    this.scene.textures.addCanvas(key, canvas);
    this.textures.set(key, key);
    return key;
  }

  /**
   * Creates studio light fixtures (returns container with lights)
   */
  createStudioLights(scene: Phaser.Scene, width: number): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);

    // Metal truss bar at top
    const trussY = 25;
    const truss = scene.add.rectangle(width / 2, trussY, width - 40, 12, 0x505050);
    truss.setStrokeStyle(2, 0x303030);
    container.add(truss);

    // Light fixtures
    const lightCount = 5;
    const spacing = (width - 80) / (lightCount - 1);

    for (let i = 0; i < lightCount; i++) {
      const lightX = 40 + i * spacing;

      // Light housing (rectangular)
      const housing = scene.add.rectangle(lightX, trussY + 20, 30, 25, 0x404040);
      housing.setStrokeStyle(1, 0x303030);
      container.add(housing);

      // Light bulb area (yellow glow)
      const bulb = scene.add.rectangle(lightX, trussY + 35, 24, 8, 0xffffcc);
      container.add(bulb);

      // Light cone (subtle overlay)
      const cone = scene.add.graphics();
      cone.fillStyle(0xffffee, 0.03);
      cone.beginPath();
      cone.moveTo(lightX - 15, trussY + 40);
      cone.lineTo(lightX + 15, trussY + 40);
      cone.lineTo(lightX + 80, 400);
      cone.lineTo(lightX - 80, 400);
      cone.closePath();
      cone.fill();
      container.add(cone);
    }

    container.setDepth(1000);
    return container;
  }

  /**
   * Creates a circular hole texture (for the board hole overlay)
   */
  createHole(radius: number, key: string = 'hole'): string {
    if (this.textures.has(key)) {
      return this.textures.get(key)!;
    }

    const size = radius * 2 + 10;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const centerX = size / 2;
    const centerY = size / 2;

    // Deep black hole with gradient
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, '#000000');
    gradient.addColorStop(0.7, '#0a0a0a');
    gradient.addColorStop(0.95, '#2a2a2a');
    gradient.addColorStop(1, 'rgba(42, 42, 42, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner ring highlight
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
    ctx.stroke();

    this.scene.textures.addCanvas(key, canvas);
    this.textures.set(key, key);
    return key;
  }

  /**
   * Draws realistic wood grain using Perlin-like noise
   */
  private drawWoodGrain(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    darkColor: string,
    lightColor: string,
    direction: 'horizontal' | 'vertical' = 'horizontal'
  ): void {
    const grainCount = direction === 'horizontal' ? height / 15 : width / 15;

    for (let i = 0; i < grainCount; i++) {
      const position = direction === 'horizontal'
        ? (i / grainCount) * height
        : (i / grainCount) * width;

      // Random grain width and opacity
      const grainWidth = Math.random() * 3 + 1;
      const opacity = Math.random() * 0.3 + 0.1;
      const isDark = Math.random() > 0.5;

      ctx.strokeStyle = isDark
        ? darkColor.replace(')', `, ${opacity})`).replace('rgb', 'rgba')
        : lightColor.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
      ctx.lineWidth = grainWidth;

      ctx.beginPath();
      if (direction === 'horizontal') {
        // Add slight wave to grain
        const waveAmplitude = Math.random() * 10;
        for (let x = 0; x < width; x += 5) {
          const y = position + Math.sin(x / 30) * waveAmplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      } else {
        const waveAmplitude = Math.random() * 10;
        for (let y = 0; y < height; y += 5) {
          const x = position + Math.sin(y / 30) * waveAmplitude;
          if (y === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // Add knots
    for (let i = 0; i < 3; i++) {
      const knotX = Math.random() * width;
      const knotY = Math.random() * height;
      const knotRadius = Math.random() * 15 + 5;

      const gradient = ctx.createRadialGradient(knotX, knotY, 0, knotX, knotY, knotRadius);
      gradient.addColorStop(0, darkColor.replace(')', ', 0.5)').replace('rgb', 'rgba'));
      gradient.addColorStop(1, darkColor.replace(')', ', 0)').replace('rgb', 'rgba'));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(knotX, knotY, knotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Draws glossy highlights for polished surfaces
   */
  private drawGlossyHighlights(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Top-left highlight
    const gradient1 = ctx.createLinearGradient(0, 0, width * 0.5, height * 0.5);
    gradient1.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    gradient1.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient1;
    ctx.fillRect(0, 0, width, height);

    // Diagonal shine streaks
    for (let i = 0; i < 8; i++) {
      const x = (i / 8) * width;
      const gradient = ctx.createLinearGradient(x, 0, x + 50, height);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${Math.random() * 0.08})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, 0, 50, height);
    }
  }

  /**
   * Draws basketball court lines
   */
  private drawCourtLines(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;

    // Center circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.15, 0, Math.PI * 2);
    ctx.stroke();

    // Three-point arc (partial)
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.85, Math.min(width, height) * 0.35, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();

    // Free throw line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.3, height * 0.7);
    ctx.lineTo(width * 0.7, height * 0.7);
    ctx.stroke();
  }

  /**
   * Draws vignette effect for depth
   */
  private drawVignette(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number = 0.3
  ): void {
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.3,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Cleanup textures
   */
  destroy(): void {
    this.textures.forEach((key) => {
      if (this.scene.textures.exists(key)) {
        this.scene.textures.remove(key);
      }
    });
    this.textures.clear();
  }
}

/**
 * Dynamic Lighting Manager
 * Uses Phaser's Light2D pipeline to add depth to 2D objects
 */
export class DynamicLightingManager {
  private scene: Phaser.Scene;
  private mainLight?: Phaser.GameObjects.Light;
  private ambientLight?: Phaser.GameObjects.Light;
  private pointerLight?: Phaser.GameObjects.Light;
  private enabled: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Enable dynamic lighting system
   */
  enable(): void {
    if (this.enabled) return;

    // Enable lights globally
    this.scene.lights.enable();
    this.scene.lights.setAmbientColor(0x404040); // Dim ambient light

    // Main overhead light (simulates studio lighting)
    this.mainLight = this.scene.lights.addLight(
      this.scene.scale.width / 2,
      this.scene.scale.height * 0.3,
      400, // radius
      0xffffff,
      1.5 // intensity
    );

    // Ambient fill light
    this.ambientLight = this.scene.lights.addLight(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      800,
      0xffd4a3, // Warm light
      0.6
    );

    // Pointer-following spotlight
    this.pointerLight = this.scene.lights.addLight(
      this.scene.input.activePointer.x,
      this.scene.input.activePointer.y,
      200,
      0xffffff,
      1.2
    );

    this.enabled = true;

    // Update pointer light position every frame
    this.scene.events.on('update', this.update, this);
  }

  /**
   * Disable dynamic lighting
   */
  disable(): void {
    if (!this.enabled) return;

    this.scene.lights.disable();
    this.scene.events.off('update', this.update, this);
    this.enabled = false;
  }

  /**
   * Update pointer light to follow mouse/touch
   */
  private update(): void {
    if (!this.enabled || !this.pointerLight) return;

    const pointer = this.scene.input.activePointer;

    // Smooth interpolation for light movement
    const smoothing = 0.15;
    this.pointerLight.x += (pointer.x - this.pointerLight.x) * smoothing;
    this.pointerLight.y += (pointer.y - this.pointerLight.y) * smoothing;

    // Vary intensity based on whether pointer is active
    if (pointer.isDown) {
      this.pointerLight.setIntensity(1.8);
      this.pointerLight.setRadius(250);
    } else {
      this.pointerLight.setIntensity(1.2);
      this.pointerLight.setRadius(200);
    }
  }

  /**
   * Add light pipeline to a game object
   */
  addToPipeline(gameObject: Phaser.GameObjects.GameObject): void {
    if (!this.enabled) return;

    if ('setPipeline' in gameObject && typeof gameObject.setPipeline === 'function') {
      gameObject.setPipeline('Light2D');
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.disable();
    this.mainLight = undefined;
    this.ambientLight = undefined;
    this.pointerLight = undefined;
  }
}
