/**
 * Collectible System and Formations for Terminal Runner (HTML5 Canvas)
 * Includes Data Bits (+50 pts), Data Bytes (+100 pts), and Quantum Crypto Blocks (+250 pts).
 */

import {
  SCREEN_WIDTH, GROUND_Y, COLOR_NEON_AMBER, COLOR_NEON_CYAN,
  COLOR_WHITE, POINTS_DATA_BIT, POINTS_DATA_BYTE, POINTS_CRYPTO_BLOCK
} from './config.ts';
import { Rect, CollectibleTier } from './types.ts';
import { ParticleManager } from './particle.ts';
import { AudioManager } from './audio.ts';

export class Collectible {
  public x: number;
  public y: number;
  public baseY: number;
  public tier: CollectibleTier;
  public size: number;
  public width: number;
  public height: number;
  public rect: Rect;
  public animTimer: number;
  public collected: boolean = false;
  public color: string;
  public points: number;

  constructor(x: number, y: number, tier: CollectibleTier = "bit") {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.tier = tier;
    this.size = tier !== "crypto" ? 18 : 22;
    this.width = this.size;
    this.height = this.size;
    this.rect = { x: Math.floor(x), y: Math.floor(y), width: this.size, height: this.size };
    this.animTimer = Math.random() * 5.0;

    if (tier === "bit") {
      this.color = COLOR_NEON_AMBER;
      this.points = POINTS_DATA_BIT;
    } else if (tier === "byte") {
      this.color = COLOR_NEON_CYAN;
      this.points = POINTS_DATA_BYTE;
    } else {
      this.color = "#ffd700"; // Quantum Gold
      this.points = POINTS_CRYPTO_BLOCK;
    }
  }

  public update(dt: number, worldSpeed: number): void {
    this.x -= worldSpeed * dt * 60.0;
    this.animTimer += dt;
    this.y = this.baseY + Math.sin(this.animTimer * 5.0) * 3.5;
    this.rect.x = Math.floor(this.x);
    this.rect.y = Math.floor(this.y);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const cx = this.x + this.size / 2;
    const cy = this.y + this.size / 2;

    // Pulsing outer aura
    const pulse = 0.5 + 0.5 * Math.sin(this.animTimer * 8.0);
    const auraR = this.size / 2 + 3 + pulse * 2;

    ctx.fillStyle = this.tier === 'bit' ? `rgba(255, 170, 0, ${(0.15 + pulse * 0.1).toFixed(2)})`
                  : this.tier === 'byte' ? `rgba(0, 240, 255, ${(0.15 + pulse * 0.1).toFixed(2)})`
                  : `rgba(255, 215, 0, ${(0.2 + pulse * 0.15).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Rotating wireframe diamond / cube
    const angle = this.animTimer * 3.0;
    const r = this.size / 2 - 2;
    const pts = [
      { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) },
      { x: cx + r * Math.cos(angle + Math.PI / 2), y: cy + r * Math.sin(angle + Math.PI / 2) },
      { x: cx + r * Math.cos(angle + Math.PI), y: cy + r * Math.sin(angle + Math.PI) },
      { x: cx + r * Math.cos(angle + 3 * Math.PI / 2), y: cy + r * Math.sin(angle + 3 * Math.PI / 2) }
    ];

    // Inner diamond
    ctx.fillStyle = "#0f141c";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Central white core
    ctx.fillStyle = COLOR_WHITE;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class CollectibleSpawner {
  public collectibles: Collectible[] = [];
  public distanceTracker: number = 0.0;
  public nextSpawnDistance: number = 280.0;

  public clear(): void {
    this.collectibles = [];
    this.distanceTracker = 0.0;
    this.nextSpawnDistance = 280.0;
  }

  public update(dt: number, worldSpeed: number, totalDistance: number): void {
    for (const item of this.collectibles) {
      item.update(dt, worldSpeed);
    }

    this.collectibles = this.collectibles.filter(item => item.x + item.size > -30 && !item.collected);

    this.distanceTracker += worldSpeed * dt * 60.0;
    if (this.distanceTracker >= this.nextSpawnDistance) {
      this.spawnPattern(totalDistance);
      this.distanceTracker = 0.0;
      this.nextSpawnDistance = 320.0 + Math.random() * 240.0;
    }
  }

  public spawnPattern(totalDistance: number): void {
    const spawnX = SCREEN_WIDTH + 50;
    const patterns = ["line_low", "line_high", "arc", "duck_line", "solo_gold"];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    if (pattern === "line_low") {
      for (let i = 0; i < 3; i++) {
        this.collectibles.push(new Collectible(spawnX + i * 36, GROUND_Y - 34, "bit"));
      }
    } else if (pattern === "line_high") {
      for (let i = 0; i < 3; i++) {
        this.collectibles.push(new Collectible(spawnX + i * 36, GROUND_Y - 95, "byte"));
      }
    } else if (pattern === "arc") {
      for (let i = 0; i < 5; i++) {
        const progress = i / 4.0;
        const arcY = GROUND_Y - 35 - Math.sin(progress * Math.PI) * 80;
        const tier: CollectibleTier = i === 2 ? "byte" : "bit";
        this.collectibles.push(new Collectible(spawnX + i * 32, arcY, tier));
      }
    } else if (pattern === "duck_line") {
      for (let i = 0; i < 3; i++) {
        this.collectibles.push(new Collectible(spawnX + i * 34, GROUND_Y - 20, "bit"));
      }
    } else if (pattern === "solo_gold" && totalDistance > 800) {
      this.collectibles.push(new Collectible(spawnX, GROUND_Y - 80, "crypto"));
    }
  }

  public checkCollection(
    playerRect: Rect,
    scoreMultiplier: number = 1,
    particleManager?: ParticleManager,
    audioManager?: AudioManager
  ): number {
    let earnedPoints = 0;

    for (const item of this.collectibles) {
      if (
        !item.collected &&
        playerRect.x < item.rect.x + item.rect.width &&
        playerRect.x + playerRect.width > item.rect.x &&
        playerRect.y < item.rect.y + item.rect.height &&
        playerRect.y + playerRect.height > item.rect.y
      ) {
        item.collected = true;
        const pts = item.points * scoreMultiplier;
        earnedPoints += pts;

        if (particleManager) {
          particleManager.emitCollectSparkles(item.x + item.size / 2, item.y + item.size / 2, item.color);
          const textColor = scoreMultiplier === 1 ? item.color : "#ffe650";
          let sign = `+${pts}`;
          if (scoreMultiplier > 1) {
            sign += " (2X)";
          }
          particleManager.addFloatingText(sign, item.x, item.y - 12, textColor, 16);
        }

        if (audioManager) {
          audioManager.play("collect");
        }
      }
    }

    return earnedPoints;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const item of this.collectibles) {
      item.draw(ctx);
    }
  }
}
