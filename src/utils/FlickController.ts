import Phaser from 'phaser';

export class FlickController {
  private scene: Phaser.Scene;
  private startX = 0;
  private startY = 0;
  private isTracking = false;
  private inputLocked = false;
  private targetBody: MatterJS.BodyType | null = null;

  private aimLine: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.aimLine = scene.add.graphics();
    this.aimLine.setDepth(1000);

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
    this.aimLine.clear();
  }

  unlockInput(): void {
    this.inputLocked = false;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.inputLocked || !this.targetBody) return;

    this.isTracking = true;
    this.startX = pointer.x;
    this.startY = pointer.y;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isTracking || !this.targetBody) return;

    this.aimLine.clear();

    const dx = this.startX - pointer.x;
    const dy = this.startY - pointer.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) return;

    const ballX = this.targetBody.position.x;
    const ballY = this.targetBody.position.y;
    const angle = Math.atan2(dy, dx);
    const lineLength = Math.min(distance * 1.5, 200);

    // Draw aim line in YELLOW
    this.aimLine.lineStyle(6, 0xffff00, 1);
    this.aimLine.beginPath();
    this.aimLine.moveTo(ballX, ballY);
    this.aimLine.lineTo(
      ballX + Math.cos(angle) * lineLength,
      ballY + Math.sin(angle) * lineLength
    );
    this.aimLine.strokePath();

    // Arrowhead
    const tipX = ballX + Math.cos(angle) * lineLength;
    const tipY = ballY + Math.sin(angle) * lineLength;
    this.aimLine.fillStyle(0xffff00, 1);
    this.aimLine.fillTriangle(
      tipX, tipY,
      tipX - Math.cos(angle - 0.4) * 20,
      tipY - Math.sin(angle - 0.4) * 20,
      tipX - Math.cos(angle + 0.4) * 20,
      tipY - Math.sin(angle + 0.4) * 20
    );
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    this.aimLine.clear();

    if (!this.isTracking || this.inputLocked || !this.targetBody) {
      this.isTracking = false;
      return;
    }

    this.isTracking = false;

    const dx = this.startX - pointer.x;
    const dy = this.startY - pointer.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Need at least 20px drag
    if (distance < 20) {
      return;
    }

    // Make body dynamic
    if (this.targetBody.isStatic) {
      this.scene.matter.body.setStatic(this.targetBody, false);
    }

    // Calculate velocity - scale by distance, cap at reasonable speed
    const power = Math.min(distance / 30, 15); // Max velocity of 15
    const angle = Math.atan2(dy, dx);

    const vx = Math.cos(angle) * power;
    const vy = Math.sin(angle) * power;

    // SET VELOCITY DIRECTLY - much more reliable than applyForce
    this.scene.matter.body.setVelocity(this.targetBody, { x: vx, y: vy });

    this.scene.events.emit('flick');
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.aimLine.destroy();
  }
}
