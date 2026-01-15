import Phaser from 'phaser';

export interface FlickControllerConfig {
  // Power settings
  powerScale?: number; // How drag distance affects power (default: 1/30)
  maxPower?: number; // Maximum velocity (default: 15)
  minDragDistance?: number; // Minimum drag in pixels to register (default: 20)

  // Aim line appearance
  aimLineColor?: number; // Hex color (default: 0xffff00)
  aimLineWidth?: number; // Line thickness (default: 6)
  aimLineMaxLength?: number; // Max visual length (default: 200)
  showArrow?: boolean; // Show arrow at end (default: true)

  // Colors can change based on power level
  colorByPower?: boolean; // Use green→yellow→red gradient (default: false)

  // Target position override (if not using matter body)
  getTargetPosition?: () => { x: number; y: number };

  // Callbacks
  onDragStart?: (pointer: Phaser.Input.Pointer) => void;
  onDragMove?: (pointer: Phaser.Input.Pointer, distance: number, angle: number) => void;
  onFlick?: (velocity: { x: number; y: number }, angle: number, power: number) => void;
}

export interface FlickData {
  velocity: { x: number; y: number };
  angle: number;
  power: number;
  dragDistance: number;
}

export class FlickController {
  private scene: Phaser.Scene;
  private config: Required<FlickControllerConfig>;

  private startX = 0;
  private startY = 0;
  private isTracking = false;
  private inputLocked = false;
  private targetBody: MatterJS.BodyType | null = null;

  private aimLine: Phaser.GameObjects.Graphics;
  private trajectoryDots: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: FlickControllerConfig = {}) {
    this.scene = scene;

    // Merge with defaults
    this.config = {
      powerScale: config.powerScale ?? 1/30,
      maxPower: config.maxPower ?? 15,
      minDragDistance: config.minDragDistance ?? 20,
      aimLineColor: config.aimLineColor ?? 0xffff00,
      aimLineWidth: config.aimLineWidth ?? 6,
      aimLineMaxLength: config.aimLineMaxLength ?? 200,
      showArrow: config.showArrow ?? true,
      colorByPower: config.colorByPower ?? false,
      getTargetPosition: config.getTargetPosition ?? (() => {
        if (this.targetBody) {
          return { x: this.targetBody.position.x, y: this.targetBody.position.y };
        }
        return { x: 0, y: 0 };
      }),
      onDragStart: config.onDragStart ?? (() => {}),
      onDragMove: config.onDragMove ?? (() => {}),
      onFlick: config.onFlick ?? (() => {}),
    };

    this.aimLine = scene.add.graphics();
    this.aimLine.setDepth(1000);

    this.trajectoryDots = scene.add.graphics();
    this.trajectoryDots.setDepth(999);

    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);
  }

  setTarget(body: MatterJS.BodyType | null): void {
    this.targetBody = body;
  }

  lockInput(): void {
    this.inputLocked = true;
    this.isTracking = false;
    this.clearVisuals();
  }

  unlockInput(): void {
    this.inputLocked = false;
  }

  clearVisuals(): void {
    this.aimLine.clear();
    this.trajectoryDots.clear();
  }

  getAimLineGraphics(): Phaser.GameObjects.Graphics {
    return this.aimLine;
  }

  getTrajectoryGraphics(): Phaser.GameObjects.Graphics {
    return this.trajectoryDots;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.inputLocked) return;

    this.isTracking = true;
    this.startX = pointer.x;
    this.startY = pointer.y;

    this.config.onDragStart(pointer);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isTracking) return;

    this.clearVisuals();

    const dx = this.startX - pointer.x;
    const dy = this.startY - pointer.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) return;

    const targetPos = this.config.getTargetPosition();
    const angle = Math.atan2(dy, dx);
    const lineLength = Math.min(distance * 1.5, this.config.aimLineMaxLength);

    // Calculate power for color coding
    const power = Math.min(distance * this.config.powerScale, this.config.maxPower);
    const powerRatio = power / this.config.maxPower;

    // Determine color
    let lineColor = this.config.aimLineColor;
    if (this.config.colorByPower) {
      // Green (low) → Yellow (medium) → Red (high)
      if (powerRatio < 0.33) {
        lineColor = 0x4caf50; // Green
      } else if (powerRatio < 0.66) {
        lineColor = 0xffeb3b; // Yellow
      } else {
        lineColor = 0xf44336; // Red
      }
    }

    // Draw aim line
    this.aimLine.lineStyle(this.config.aimLineWidth, lineColor, 1);
    this.aimLine.beginPath();
    this.aimLine.moveTo(targetPos.x, targetPos.y);
    this.aimLine.lineTo(
      targetPos.x + Math.cos(angle) * lineLength,
      targetPos.y + Math.sin(angle) * lineLength
    );
    this.aimLine.strokePath();

    // Draw arrowhead
    if (this.config.showArrow) {
      const tipX = targetPos.x + Math.cos(angle) * lineLength;
      const tipY = targetPos.y + Math.sin(angle) * lineLength;
      this.aimLine.fillStyle(lineColor, 1);
      this.aimLine.fillTriangle(
        tipX, tipY,
        tipX - Math.cos(angle - 0.4) * 20,
        tipY - Math.sin(angle - 0.4) * 20,
        tipX - Math.cos(angle + 0.4) * 20,
        tipY - Math.sin(angle + 0.4) * 20
      );
    }

    this.config.onDragMove(pointer, distance, angle);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    this.clearVisuals();

    if (!this.isTracking || this.inputLocked) {
      this.isTracking = false;
      return;
    }

    this.isTracking = false;

    const dx = this.startX - pointer.x;
    const dy = this.startY - pointer.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Need minimum drag distance
    if (distance < this.config.minDragDistance) {
      return;
    }

    // Calculate velocity
    const power = Math.min(distance * this.config.powerScale, this.config.maxPower);
    const angle = Math.atan2(dy, dx);

    const vx = Math.cos(angle) * power;
    const vy = Math.sin(angle) * power;

    const velocity = { x: vx, y: vy };

    // If using matter body, apply velocity directly
    if (this.targetBody) {
      if (this.targetBody.isStatic) {
        this.scene.matter.body.setStatic(this.targetBody, false);
      }
      this.scene.matter.body.setVelocity(this.targetBody, velocity);
    }

    // Emit event and callback
    this.scene.events.emit('flick', { velocity, angle, power, dragDistance: distance });
    this.config.onFlick(velocity, angle, power);
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.aimLine.destroy();
    this.trajectoryDots.destroy();
  }
}
