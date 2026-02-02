import Phaser from 'phaser';
import { PHYSICS_MATERIALS, MISS_CONFIG } from '../config/physicsConfig';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import type { Station, StationId } from '../types';

export class CornholeStation implements Station {
  id: StationId = 'cornhole';
  name = 'Cornhole';
  spawnPoint = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 120 };
  cameraAnchor = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
  bounds: Phaser.Geom.Rectangle;

  private scene: Phaser.Scene;
  private board: MatterJS.BodyType | null = null;
  private boardSprite: Phaser.GameObjects.Sprite | null = null;
  private holeSensor: MatterJS.BodyType | null = null;
  private floorSensor: MatterJS.BodyType | null = null;
  private beanbag: Phaser.Physics.Matter.Sprite | null = null;
  private holeGraphic: Phaser.GameObjects.Graphics | null = null;

  // State tracking
  private isInHole = false;
  private stoppedTime = 0;
  private wasMoving = true;
  private hasBeenFlicked = false;

  // Callbacks
  private onSuccess: (() => void) | null = null;
  private onMiss: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bounds = new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  setCallbacks(onSuccess: () => void, onMiss: () => void): void {
    this.onSuccess = onSuccess;
    this.onMiss = onMiss;
  }

  init(): void {
    this.createBoard();
    this.createHoleSensor();
    this.createFloorSensor();
    this.setupCollisionHandlers();
  }

  private createBoard(): void {
    const boardX = GAME_WIDTH / 2;
    const boardY = GAME_HEIGHT / 2 + 50;
    const boardWidth = 180;
    const boardHeight = 280;
    const boardAngle = -12 * (Math.PI / 180);

    // Visual board
    this.boardSprite = this.scene.add.sprite(boardX, boardY, 'wood');
    this.boardSprite.setDisplaySize(boardWidth, boardHeight);
    this.boardSprite.setRotation(boardAngle);

    // Physics body for board
    this.board = this.scene.matter.add.rectangle(boardX, boardY, boardWidth, boardHeight, {
      isStatic: true,
      friction: PHYSICS_MATERIALS.wood.friction,
      restitution: PHYSICS_MATERIALS.wood.restitution,
      angle: boardAngle,
      label: 'board',
    });

    // Hole visual - positioned on the board
    const holeOffsetY = -80;
    const holeX = boardX + Math.sin(-boardAngle) * holeOffsetY;
    const holeY = boardY + Math.cos(-boardAngle) * holeOffsetY;

    this.holeGraphic = this.scene.add.graphics();
    this.holeGraphic.fillStyle(0x000000);
    this.holeGraphic.fillCircle(holeX, holeY, 32);
    this.holeGraphic.setDepth(1);
  }

  private createHoleSensor(): void {
    const boardX = GAME_WIDTH / 2;
    const boardY = GAME_HEIGHT / 2 + 50;
    const boardAngle = -12 * (Math.PI / 180);
    const holeOffsetY = -80;

    const holeX = boardX + Math.sin(-boardAngle) * holeOffsetY;
    const holeY = boardY + Math.cos(-boardAngle) * holeOffsetY;

    this.holeSensor = this.scene.matter.add.circle(holeX, holeY, 28, {
      isStatic: true,
      isSensor: true,
      label: 'holeSensor',
    });

    console.log('Hole sensor created at:', holeX, holeY);
  }

  private createFloorSensor(): void {
    this.floorSensor = this.scene.matter.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT + 50,
      GAME_WIDTH * 2,
      100,
      {
        isStatic: true,
        isSensor: true,
        label: 'floorSensor',
      }
    );
  }

  private setupCollisionHandlers(): void {
    this.scene.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      for (const pair of event.pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label];

        if (labels.includes('holeSensor') && labels.includes('beanbag')) {
          console.log('Beanbag entered hole!');
          this.isInHole = true;
        }

        if (labels.includes('floorSensor') && labels.includes('beanbag')) {
          console.log('Beanbag hit floor - MISS');
          this.handleMiss();
        }
      }
    });

    this.scene.matter.world.on('collisionend', (event: Phaser.Physics.Matter.Events.CollisionEndEvent) => {
      for (const pair of event.pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        if (labels.includes('holeSensor') && labels.includes('beanbag')) {
          this.isInHole = false;
        }
      }
    });
  }

  spawn(): void {
    if (this.beanbag) {
      this.beanbag.destroy();
    }

    this.isInHole = false;
    this.stoppedTime = 0;
    this.wasMoving = true;
    this.hasBeenFlicked = false;

    // Create beanbag - starts STATIC
    this.beanbag = this.scene.matter.add.sprite(
      this.spawnPoint.x,
      this.spawnPoint.y,
      'beanbag',
      undefined,
      {
        shape: { type: 'rectangle', width: 36, height: 36 },
        friction: PHYSICS_MATERIALS.beanbag.friction,
        frictionAir: PHYSICS_MATERIALS.beanbag.frictionAir,
        restitution: PHYSICS_MATERIALS.beanbag.restitution,
        density: PHYSICS_MATERIALS.beanbag.density,
        label: 'beanbag',
        isStatic: true,
      }
    );

    this.beanbag.setDepth(10);
    console.log('Beanbag spawned at:', this.spawnPoint.x, this.spawnPoint.y);
    console.log('Beanbag body:', this.beanbag.body ? 'exists' : 'NULL');
  }

  getBeanbagBody(): MatterJS.BodyType | null {
    if (!this.beanbag || !this.beanbag.body) {
      console.log('getBeanbagBody: beanbag or body is null');
      return null;
    }
    return this.beanbag.body as MatterJS.BodyType;
  }

  releaseBeanbag(): void {
    if (this.beanbag && this.beanbag.body) {
      this.scene.matter.body.setStatic(this.beanbag.body as MatterJS.BodyType, false);
      this.hasBeenFlicked = true;
    }
  }

  reset(): void {
    this.spawn();
  }

  checkSuccess(): boolean {
    if (!this.beanbag?.body || !this.isInHole) return false;
    const body = this.beanbag.body as MatterJS.BodyType;
    const velocity = body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    return speed < MISS_CONFIG.velocityThreshold;
  }

  update(): void {
    if (!this.beanbag || !this.beanbag.body) return;

    // Don't check for misses until the beanbag has been flicked
    if (!this.hasBeenFlicked) return;

    const body = this.beanbag.body as MatterJS.BodyType;
    const velocity = body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const isMoving = speed > MISS_CONFIG.velocityThreshold;

    // Success check
    if (this.isInHole && !isMoving) {
      console.log('SUCCESS! Beanbag in hole and stopped');
      if (this.onSuccess) {
        this.onSuccess();
      }
      return;
    }

    // Miss check - ball stopped outside hole
    if (!isMoving && !this.isInHole) {
      if (this.wasMoving) {
        this.stoppedTime = Date.now();
        this.wasMoving = false;
      } else if (Date.now() - this.stoppedTime > MISS_CONFIG.stoppedTimeMs) {
        console.log('Beanbag stopped outside hole - MISS');
        this.handleMiss();
      }
    } else {
      this.wasMoving = isMoving;
    }

    // Off-screen check
    const pos = body.position;
    if (pos.x < -50 || pos.x > GAME_WIDTH + 50 || pos.y < -100) {
      console.log('Beanbag off screen - MISS');
      this.handleMiss();
    }
  }

  private handleMiss(): void {
    if (this.onMiss) {
      this.onMiss();
    }
  }

  destroy(): void {
    if (this.beanbag) this.beanbag.destroy();
    if (this.boardSprite) this.boardSprite.destroy();
    if (this.holeGraphic) this.holeGraphic.destroy();
    if (this.board) this.scene.matter.world.remove(this.board);
    if (this.holeSensor) this.scene.matter.world.remove(this.holeSensor);
    if (this.floorSensor) this.scene.matter.world.remove(this.floorSensor);
  }
}
