/**
 * Power-Up System and Manager for Terminal Runner (HTML5 Canvas)
 * Includes:
 * 1. 🛡️ Shield Matrix (Absorbs 1 fatal hit)
 * 2. ⚡ 2X Overclock Multiplier (Doubles points for 10 seconds)
 * 3. ⏱️ Chrono Slow-Motion (Slows world speed by 48% for 8 seconds)
 */

import {
  SCREEN_WIDTH, GROUND_Y, COLOR_NEON_CYAN, COLOR_NEON_AMBER,
  COLOR_NEON_PURPLE, COLOR_WHITE, COLOR_SURFACE,
  DURATION_DOUBLE_SCORE, DURATION_SLOW_MOTION, SLOW_MOTION_FACTOR
} from './config.ts';
import { Rect, PowerUpType } from './types.ts';
import { Player } from './player.ts';
import { ParticleManager } from './particle.ts';
import { AudioManager } from './audio.ts';

export class PowerUpItem {
  public x: number;
  public y: number;
  public baseY: number;
  public ptype: PowerUpType;
  public size: number = 28;
  public rect: Rect;
  public animTimer: number;
  public collected: boolean = false;
  public color: string;
  public label: string;

  constructor(x: number, y: number, ptype: PowerUpType) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.ptype = ptype;
    this.rect = { x: Math.floor(x), y: Math.floor(y), width: this.size, height: this.size };
    this.animTimer = Math.random() * 5.0;

    if (ptype === "shield") {
      this.color = COLOR_NEON_CYAN;
      this.label = "S";
    } else if (ptype === "double_score") {
      this.color = COLOR_NEON_AMBER;
      this.label = "2X";
    } else {
      this.color = COLOR_NEON_PURPLE;
      this.label = "SLOW";
    }
  }

  public update(dt: number, worldSpeed: number): void {
    this.x -= worldSpeed * dt * 60.0;
    this.animTimer += dt;
    this.y = this.baseY + Math.sin(this.animTimer * 4.5) * 5.0;
    this.rect.x = Math.floor(this.x);
    this.rect.y = Math.floor(this.y);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const cx = this.x + this.size / 2;
    const cy = this.y + this.size / 2;

    // Pulsing outer ring
    const pulse = 0.5 + 0.5 * Math.sin(this.animTimer * 6.0);
    const glowR = this.size / 2 + 4 + pulse * 3;

    ctx.fillStyle = this.ptype === 'shield' ? `rgba(0, 240, 255, ${(0.16 + pulse * 0.14).toFixed(2)})`
                  : this.ptype === 'double_score' ? `rgba(255, 170, 0, ${(0.16 + pulse * 0.14).toFixed(2)})`
                  : `rgba(188, 19, 254, ${(0.16 + pulse * 0.14).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Box container
    ctx.fillStyle = COLOR_SURFACE;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.size, this.size, 6);
    ctx.fill();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rotating corner dots
    const angle = this.animTimer * 2.5;
    ctx.fillStyle = COLOR_WHITE;
    for (let i = 0; i < 4; i++) {
      const rad = angle + i * (Math.PI / 2);
      const bx = cx + (this.size / 2 + 2) * Math.cos(rad);
      const by = cy + (this.size / 2 + 2) * Math.sin(rad);
      ctx.beginPath();
      ctx.arc(bx, by, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Centered label
    ctx.fillStyle = this.color;
    ctx.font = `bold ${this.label.length <= 2 ? 13 : 10}px "Share Tech Mono", "Consolas", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.label, cx, cy);

    ctx.restore();
  }
}

export class PowerUpManager {
  public items: PowerUpItem[] = [];
  public spawnDistanceTracker: number = 0.0;
  public nextSpawnDistance: number = 650.0;

  // Active timers
  public doubleScoreTimer: number = 0.0;
  public slowMotionTimer: number = 0.0;

  public reset(): void {
    this.items = [];
    this.spawnDistanceTracker = 0.0;
    this.nextSpawnDistance = 650.0;
    this.doubleScoreTimer = 0.0;
    this.slowMotionTimer = 0.0;
  }

  public get isDoubleScore(): boolean {
    return this.doubleScoreTimer > 0.0;
  }

  public get isSlowMotion(): boolean {
    return this.slowMotionTimer > 0.0;
  }

  public get speedMultiplier(): number {
    return this.isSlowMotion ? SLOW_MOTION_FACTOR : 1.0;
  }

  public get scoreMultiplier(): number {
    return this.isDoubleScore ? 2 : 1;
  }

  public update(dt: number, worldSpeed: number, player: Player, _totalDistance: number): void {
    // Countdown active timers
    if (this.doubleScoreTimer > 0) {
      this.doubleScoreTimer -= dt;
    }
    if (this.slowMotionTimer > 0) {
      this.slowMotionTimer -= dt;
    }

    // Update items on field
    for (const item of this.items) {
      item.update(dt, worldSpeed);
    }
    this.items = this.items.filter(item => item.x + item.size > -40 && !item.collected);

    // Spawning logic
    this.spawnDistanceTracker += worldSpeed * dt * 60.0;
    if (this.spawnDistanceTracker >= this.nextSpawnDistance) {
      this.spawnPowerup(player);
      this.spawnDistanceTracker = 0.0;
      this.nextSpawnDistance = 850.0 + Math.random() * 600.0;
    }
  }

  public spawnPowerup(player: Player): void {
    const spawnX = SCREEN_WIDTH + 60;
    const spawnY = GROUND_Y - (Math.random() < 0.5 ? 45 : 80);

    const candidates: PowerUpType[] = ["double_score", "slow_motion"];
    if (!player.hasShield) {
      candidates.push("shield");
    }

    const ptype = candidates[Math.floor(Math.random() * candidates.length)];
    this.items.push(new PowerUpItem(spawnX, spawnY, ptype));
  }

  public checkCollection(player: Player, particleManager?: ParticleManager, audioManager?: AudioManager): void {
    for (const item of this.items) {
      if (
        !item.collected &&
        player.rect.x < item.rect.x + item.rect.width &&
        player.rect.x + player.rect.width > item.rect.x &&
        player.rect.y < item.rect.y + item.rect.height &&
        player.rect.y + player.rect.height > item.rect.y
      ) {
        item.collected = true;
        this.activatePowerup(item.ptype, player, particleManager, audioManager, item.x, item.y);
      }
    }
  }

  private activatePowerup(
    ptype: PowerUpType,
    player: Player,
    particleManager?: ParticleManager,
    audioManager?: AudioManager,
    x: number = 0,
    y: number = 0
  ): void {
    if (audioManager) {
      audioManager.play("powerup");
    }

    if (ptype === "shield") {
      player.hasShield = true;
      if (particleManager) {
        particleManager.emitPowerupFlash(x, y, COLOR_NEON_CYAN);
        particleManager.addFloatingText("SHIELD ACTIVATED!", x, y - 20, COLOR_NEON_CYAN, 18);
      }
    } else if (ptype === "double_score") {
      this.doubleScoreTimer = DURATION_DOUBLE_SCORE;
      if (particleManager) {
        particleManager.emitPowerupFlash(x, y, COLOR_NEON_AMBER);
        particleManager.addFloatingText("2X SCORE MULTIPLIER!", x, y - 20, COLOR_NEON_AMBER, 18);
      }
    } else if (ptype === "slow_motion") {
      this.slowMotionTimer = DURATION_SLOW_MOTION;
      if (particleManager) {
        particleManager.emitPowerupFlash(x, y, COLOR_NEON_PURPLE);
        particleManager.addFloatingText("CHRONO SLOW-MO!", x, y - 20, COLOR_NEON_PURPLE, 18);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const item of this.items) {
      item.draw(ctx);
    }
  }
}
