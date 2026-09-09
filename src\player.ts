/**
 * Player Entity and Animation Controller for Terminal Runner (HTML5 Canvas)
 * Handles physics (variable jump, coyote time, jump buffer, fast-falling), dynamic hitboxes,
 * and procedural cyberpunk character rendering.
 */

import {
  GROUND_Y, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_DUCK_WIDTH, PLAYER_DUCK_HEIGHT,
  PLAYER_START_X, GRAVITY, JUMP_VELOCITY, VARIABLE_JUMP_REDUCTION,
  FAST_FALL_ACCEL, COLOR_NEON_GREEN, COLOR_NEON_CYAN, COLOR_NEON_AMBER,
  COLOR_NEON_RED, COLOR_WHITE, COLOR_SURFACE
} from './config.ts';
import { Rect } from './types.ts';
import { ParticleManager } from './particle.ts';
import { AudioManager } from './audio.ts';

interface TrailPoint {
  x: number;
  y: number;
  isDucking: boolean;
  isGrounded: boolean;
}

export class Player {
  public startX: number;
  public groundY: number;
  public x: number;
  public y: number;
  public vy: number = 0.0;

  // States
  public isGrounded: boolean = true;
  public isDucking: boolean = false;
  public isCrashed: boolean = false;
  public isInvulnerable: boolean = false;
  public invulnerableTimer: number = 0.0;

  // Jump controls
  public jumpHeld: boolean = false;
  public coyoteTimer: number = 0.0;
  public jumpBufferTimer: number = 0.0;

  // Power-up status
  public hasShield: boolean = false;
  public shieldAngle: number = 0.0;

  // Animation state
  public animTimer: number = 0.0;
  public animFrame: number = 0;
  public trailHistory: TrailPoint[] = [];

  // Hitbox dimensions & bounding box
  public width: number = PLAYER_WIDTH;
  public height: number = PLAYER_HEIGHT;
  public rect: Rect = { x: 0, y: 0, width: 0, height: 0 };

  constructor(x: number = PLAYER_START_X, groundY: number = GROUND_Y) {
    this.startX = x;
    this.groundY = groundY;
    this.x = x;
    this.y = groundY - PLAYER_HEIGHT;
    this.updateHitbox();
  }

  public reset(): void {
    this.x = this.startX;
    this.y = this.groundY - PLAYER_HEIGHT;
    this.vy = 0.0;
    this.isGrounded = true;
    this.isDucking = false;
    this.isCrashed = false;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0.0;
    this.hasShield = false;
    this.shieldAngle = 0.0;
    this.jumpHeld = false;
    this.coyoteTimer = 0.0;
    this.jumpBufferTimer = 0.0;
    this.animTimer = 0.0;
    this.animFrame = 0;
    this.trailHistory = [];
    this.updateHitbox();
  }

  public jump(): void {
    if (this.isCrashed) return;
    this.jumpHeld = true;
    this.jumpBufferTimer = 0.12; // Jump buffer window
  }

  public releaseJump(): void {
    this.jumpHeld = false;
    if (!this.isGrounded && this.vy < 0) {
      this.vy *= VARIABLE_JUMP_REDUCTION;
    }
  }

  public duck(isDown: boolean): void {
    if (this.isCrashed) return;
    this.isDucking = isDown;
  }

  public applyHit(): boolean {
    if (this.isInvulnerable || this.isCrashed) {
      return false;
    }

    if (this.hasShield) {
      // Shield absorbs the lethal blow!
      this.hasShield = false;
      this.isInvulnerable = true;
      this.invulnerableTimer = 0.8; // 0.8s grace invulnerability
      return false;
    }

    // Fatal crash
    this.isCrashed = true;
    this.vy = -6.0;
    return true;
  }

  public updateHitbox(): void {
    if (this.isDucking && this.isGrounded) {
      this.width = PLAYER_DUCK_WIDTH;
      this.height = PLAYER_DUCK_HEIGHT;
      const marginX = 4;
      const marginY = 3;
      this.rect = {
        x: Math.floor(this.x + marginX),
        y: Math.floor(this.y + (PLAYER_HEIGHT - PLAYER_DUCK_HEIGHT) + marginY),
        width: this.width - marginX * 2,
        height: this.height - marginY * 2
      };
    } else {
      this.width = PLAYER_WIDTH;
      this.height = PLAYER_HEIGHT;
      const marginX = 5;
      const marginY = 4;
      this.rect = {
        x: Math.floor(this.x + marginX),
        y: Math.floor(this.y + marginY),
        width: this.width - marginX * 2,
        height: this.height - marginY * 2
      };
    }
  }

  public update(dt: number, particleManager?: ParticleManager, audioManager?: AudioManager): void {
    // Timers
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    if (this.isGrounded) {
      this.coyoteTimer = 0.09;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer -= dt;
    }

    // Handle Crash physics
    if (this.isCrashed) {
      this.vy += GRAVITY * dt * 60.0;
      this.y += this.vy * dt * 60.0;
      if (this.y > this.groundY - PLAYER_HEIGHT) {
        this.y = this.groundY - PLAYER_HEIGHT;
        this.vy = 0.0;
      }
      this.updateHitbox();
      return;
    }

    // Execute buffered jump
    if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0)) {
      this.vy = JUMP_VELOCITY;
      this.isGrounded = false;
      this.coyoteTimer = 0.0;
      this.jumpBufferTimer = 0.0;
      if (particleManager) {
        particleManager.emitJumpBurst(this.x + PLAYER_WIDTH / 2, this.groundY);
      }
      if (audioManager) {
        audioManager.play("jump");
      }
    }

    // Gravity & Vertical Movement
    let currGravity = GRAVITY;
    if (this.isDucking && !this.isGrounded) {
      currGravity *= FAST_FALL_ACCEL;
    } else if (this.vy > 0) {
      currGravity *= 1.15;
    }

    this.vy += currGravity * dt * 60.0;
    this.y += this.vy * dt * 60.0;

    // Ground collision check
    const standingY = this.groundY - PLAYER_HEIGHT;
    if (this.y >= standingY) {
      this.y = standingY;
      this.vy = 0.0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    this.updateHitbox();

    // Animation timing
    this.animTimer += dt;
    if (this.isGrounded) {
      const animSpeed = !this.isDucking ? 0.07 : 0.12;
      if (this.animTimer >= animSpeed) {
        this.animTimer = 0.0;
        this.animFrame = (this.animFrame + 1) % 6;
      }
    } else {
      this.animFrame = 0;
    }

    // Shield rotation
    if (this.hasShield) {
      this.shieldAngle = (this.shieldAngle + 120.0 * dt) % 360.0;
    }

    // Particle emissions
    if (particleManager && this.isGrounded) {
      if (this.isDucking) {
        particleManager.emitDuckSparks(this.x + 8, this.groundY - 2);
      } else {
        particleManager.emitRunSparks(this.x + 12, this.groundY - 1);
      }
    }

    // Motion trail recording
    if (this.trailHistory.length > 4) {
      this.trailHistory.shift();
    }
    this.trailHistory.push({
      x: this.x,
      y: this.y,
      isDucking: this.isDucking,
      isGrounded: this.isGrounded
    });
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // 1. Draw motion trails
    for (let idx = 0; idx < this.trailHistory.length - 1; idx++) {
      const t = this.trailHistory[idx];
      const alpha = (0.15 * (idx + 1)) / this.trailHistory.length;
      const tw = !t.isDucking ? PLAYER_WIDTH : PLAYER_DUCK_WIDTH;
      const th = !t.isDucking ? PLAYER_HEIGHT : PLAYER_DUCK_HEIGHT;
      const ty = !(t.isDucking && t.isGrounded) ? t.y : t.y + (PLAYER_HEIGHT - PLAYER_DUCK_HEIGHT);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLOR_NEON_CYAN;
      ctx.fillRect(Math.floor(t.x), Math.floor(ty), tw, th);
      ctx.restore();
    }

    // Invulnerability flicker
    if (this.isInvulnerable && Math.floor(this.invulnerableTimer * 20) % 2 === 0) {
      return;
    }

    ctx.save();
    const drawX = Math.floor(this.x);
    let drawY = Math.floor(this.y);

    if (this.isCrashed) {
      this.drawCrashSprite(ctx, drawX, drawY);
    } else if (this.isDucking && this.isGrounded) {
      drawY = Math.floor(this.y + (PLAYER_HEIGHT - PLAYER_DUCK_HEIGHT));
      this.drawDuckSprite(ctx, drawX, drawY, this.animFrame % 2);
    } else if (!this.isGrounded) {
      if (this.vy < 1.0) {
        this.drawJumpSprite(ctx, drawX, drawY);
      } else {
        this.drawFallSprite(ctx, drawX, drawY);
      }
    } else {
      this.drawRunSprite(ctx, drawX, drawY, this.animFrame);
    }

    // 2. Draw Shield Hologram
    if (this.hasShield && !this.isCrashed) {
      this.drawShield(ctx);
    }

    ctx.restore();
  }

  private drawRunSprite(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number): void {
    const legPhase = (frame / 6.0) * Math.PI * 2;

    // Torso (Cyber armor with neon core)
    ctx.fillStyle = COLOR_SURFACE;
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 16, 20, 22, 3);
    ctx.fill();

    ctx.strokeStyle = COLOR_NEON_GREEN;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 16, 20, 22, 3);
    ctx.stroke();

    // Chest glowing core
    ctx.fillStyle = COLOR_NEON_CYAN;
    ctx.fillRect(x + 17, y + 22, 6, 6);

    // Head & Helmet
    ctx.fillStyle = "#1e242c";
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 4, 16, 14, 4);
    ctx.fill();

    ctx.strokeStyle = COLOR_NEON_GREEN;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 4, 16, 14, 4);
    ctx.stroke();

    // Glowing cyber visor
    ctx.fillStyle = COLOR_NEON_CYAN;
    ctx.fillRect(x + 18, y + 8, 11, 4);
    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 9);
    ctx.lineTo(x + 28, y + 9);
    ctx.stroke();

    // Jetpack / battery
    ctx.fillStyle = "#28303a";
    ctx.fillRect(x + 6, y + 18, 5, 12);
    ctx.fillStyle = COLOR_NEON_AMBER;
    ctx.fillRect(x + 7, y + 20, 3, 4);

    // Animated Legs
    const legOffset1 = Math.sin(legPhase) * 8;
    const legOffset2 = Math.sin(legPhase + Math.PI) * 8;

    // Left leg
    ctx.strokeStyle = COLOR_NEON_GREEN;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 38);
    ctx.lineTo(x + 14 + legOffset1 * 0.5, y + 45);
    ctx.lineTo(x + 14 + legOffset1, y + 54);
    ctx.stroke();

    ctx.fillStyle = COLOR_WHITE;
    ctx.fillRect(x + 14 + legOffset1 - 2, y + 52, 6, 3);

    // Right leg
    ctx.strokeStyle = "#00c850";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 24, y + 38);
    ctx.lineTo(x + 24 + legOffset2 * 0.5, y + 45);
    ctx.lineTo(x + 24 + legOffset2, y + 54);
    ctx.stroke();

    ctx.fillStyle = COLOR_WHITE;
    ctx.fillRect(x + 24 + legOffset2 - 2, y + 52, 6, 3);

    // Arms swing
    const armSwing = Math.sin(legPhase + Math.PI) * 6;
    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 18, y + 22);
    ctx.lineTo(x + 18 + armSwing, y + 32);
    ctx.stroke();
  }

  private drawJumpSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Tucked streamlined airborne pose
    ctx.fillStyle = COLOR_SURFACE;
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 12, 20, 22, 3);
    ctx.fill();

    ctx.strokeStyle = COLOR_NEON_GREEN;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 12, 20, 22, 3);
    ctx.stroke();

    ctx.fillStyle = COLOR_NEON_CYAN;
    ctx.fillRect(x + 17, y + 18, 6, 6);

    // Head looking upward/forward
    ctx.fillStyle = "#1e242c";
    ctx.beginPath();
    ctx.roundRect(x + 13, y + 2, 16, 13, 4);
    ctx.fill();

    ctx.strokeStyle = COLOR_NEON_GREEN;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 13, y + 2, 16, 13, 4);
    ctx.stroke();

    ctx.fillStyle = COLOR_NEON_CYAN;
    ctx.fillRect(x + 19, y + 6, 11, 4);

    // Tucked legs
    ctx.strokeStyle = COLOR_NEON_GREEN;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 34);
    ctx.lineTo(x + 10, y + 42);
    ctx.lineTo(x + 16, y + 46);
    ctx.stroke();

    ctx.strokeStyle = "#00c850";
    ctx.beginPath();
    ctx.moveTo(x + 24, y + 34);
    ctx.lineTo(x + 20, y + 42);
    ctx.lineTo(x + 28, y + 44);
    ctx.stroke();

    // Jet thruster firing on back
    ctx.fillStyle = "#28303a";
    ctx.fillRect(x + 5, y + 16, 6, 12);

    ctx.fillStyle = COLOR_NEON_CYAN;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 28);
    ctx.lineTo(x + 10, y + 28);
    ctx.lineTo(x + 8, y + 38);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLOR_WHITE;
    ctx.beginPath();
    ctx.moveTo(x + 7, y + 28);
    ctx.lineTo(x + 9, y + 28);
    ctx.lineTo(x + 8, y + 34);
    ctx.closePath();
    ctx.fill();
  }

  private drawFallSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = COLOR_SURFACE;
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 14, 20, 22, 3);
    ctx.fill();

    ctx.strokeStyle = COLOR_NEON_GREEN;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 14, 20, 22, 3);
    ctx.stroke();

    ctx.fillStyle = COLOR_NEON_CYAN;
    ctx.fillRect(x + 17, y + 20, 6, 6);

    // Head
    ctx.fillStyle = "#1e242c";
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 4, 16, 13, 4);
    ctx.fill();

    ctx.fillStyle = COLOR_NEON_CYAN;
    ctx.fillRect(x + 18, y + 8, 11, 4);

    // Extended legs bracing for impact
    ctx.strokeStyle = COLOR_NEON_GREEN;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 36);
    ctx.lineTo(x + 12, y + 46);
    ctx.lineTo(x + 14, y + 54);
    ctx.stroke();

    ctx.strokeStyle = "#00c850";
    ctx.beginPath();
    ctx.moveTo(x + 24, y + 36);
    ctx.lineTo(x + 26, y + 46);
    ctx.lineTo(x + 28, y + 54);
    ctx.stroke();
  }

  private drawDuckSprite(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number): void {
    // Low elongated torso
    ctx.fillStyle = COLOR_SURFACE;
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 8, 26, 14, 3);
    ctx.fill();

    ctx.strokeStyle = COLOR_NEON_GREEN;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 8, 26, 14, 3);
    ctx.stroke();

    ctx.fillStyle = COLOR_NEON_CYAN;
    ctx.fillRect(x + 20, y + 12, 8, 5);

    // Head stretched forward
    ctx.fillStyle = "#1e242c";
    ctx.beginPath();
    ctx.roundRect(x + 36, y + 6, 14, 13, 3);
    ctx.fill();

    ctx.strokeStyle = COLOR_NEON_GREEN;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 36, y + 6, 14, 13, 3);
    ctx.stroke();

    ctx.fillStyle = COLOR_NEON_CYAN;
    ctx.fillRect(x + 42, y + 10, 8, 4);

    // Trailing sliding legs
    const legY = 18 + frame * 2;
    ctx.strokeStyle = COLOR_NEON_GREEN;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 14);
    ctx.lineTo(x + 2, y + legY);
    ctx.stroke();

    ctx.fillStyle = COLOR_WHITE;
    ctx.fillRect(x, y + legY - 2, 4, 4);

    // Thruster sparks backwards
    ctx.strokeStyle = COLOR_NEON_AMBER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 12);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
  }

  private drawCrashSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.strokeStyle = COLOR_NEON_RED;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 10, 24, 34, 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 4, y + 15);
    ctx.lineTo(x + 36, y + 45);
    ctx.stroke();

    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 35);
    ctx.lineTo(x + 34, y + 15);
    ctx.stroke();
  }

  private drawShield(ctx: CanvasRenderingContext2D): void {
    const centerX = Math.floor(this.x + PLAYER_WIDTH / 2);
    const centerY = Math.floor(this.y + PLAYER_HEIGHT / 2);
    const radius = 32;

    const points: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const rad = ((this.shieldAngle + i * 60) * Math.PI) / 180.0;
      const px = centerX + Math.floor(radius * Math.cos(rad));
      const py = centerY + Math.floor(radius * Math.sin(rad));
      points.push([px, py]);
    }

    ctx.save();
    ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
    ctx.strokeStyle = COLOR_NEON_CYAN;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Node sparks
    ctx.fillStyle = COLOR_WHITE;
    for (const [px, py] of points) {
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
