/**
 * Obstacle Entities and Spawner System for Terminal Runner (HTML5 Canvas)
 * Features 5 distinct obstacle types:
 * 1. Firewall Spikes (Single, Double, Triple neon laser ground clusters)
 * 2. Security Drones (Low duck-under / High jump-under with animated scanner cones)
 * 3. Data Pylons (High-voltage server racks with blinking LEDs)
 * 4. Laser Barriers (Overhead dual beams forcing ducking slides)
 * 5. Glitch Nodes (Shifting digital hazard blocks)
 */

import {
  SCREEN_WIDTH, GROUND_Y, COLOR_NEON_RED, COLOR_NEON_AMBER,
  COLOR_NEON_PINK, COLOR_NEON_CYAN, COLOR_NEON_PURPLE, COLOR_NEON_GREEN,
  COLOR_WHITE, COLOR_SURFACE
} from './config.ts';
import { Rect, ObstacleType } from './types.ts';

export abstract class BaseObstacle {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public obsType: ObstacleType;
  public rect: Rect;
  public passed: boolean = false;
  public animTimer: number = 0.0;

  constructor(x: number, y: number, width: number, height: number, obsType: ObstacleType) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.obsType = obsType;
    this.rect = { x: Math.floor(x), y: Math.floor(y), width, height };
  }

  public update(dt: number, worldSpeed: number): void {
    this.x -= worldSpeed * dt * 60.0;
    this.animTimer += dt;
    this.updateRect();
  }

  protected updateRect(): void {
    this.rect.x = Math.floor(this.x);
    this.rect.y = Math.floor(this.y);
  }

  public abstract draw(ctx: CanvasRenderingContext2D): void;
}

export class FirewallSpikes extends BaseObstacle {
  public clusterSize: number;
  private marginX = 3;
  private marginY = 2;

  constructor(x: number, clusterSize: number = 1) {
    const width = 24 * clusterSize;
    const height = Math.random() < 0.5 ? 36 : 42;
    const y = GROUND_Y - height;
    super(x, y, width, height, "spikes");
    this.clusterSize = clusterSize;
    this.updateRect();
  }

  protected override updateRect(): void {
    this.rect = {
      x: Math.floor(this.x + this.marginX),
      y: Math.floor(this.y + this.marginY),
      width: this.width - this.marginX * 2,
      height: this.height - this.marginY
    };
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const spikeW = 24;

    for (let i = 0; i < this.clusterSize; i++) {
      const sx = this.x + i * spikeW;
      const topPt = { x: sx + 12, y: this.y + 2 };
      const leftPt = { x: sx + 2, y: this.y + this.height };
      const rightPt = { x: sx + 22, y: this.y + this.height };

      const glowIntensity = Math.floor(180 + 75 * Math.sin(this.animTimer * 8 + i));
      const colorCore = `rgb(255, ${glowIntensity}, 0)`;

      // Dark inner backing
      ctx.fillStyle = COLOR_SURFACE;
      ctx.beginPath();
      ctx.moveTo(topPt.x, topPt.y);
      ctx.lineTo(leftPt.x, leftPt.y);
      ctx.lineTo(rightPt.x, rightPt.y);
      ctx.closePath();
      ctx.fill();

      // Outer neon frame
      ctx.strokeStyle = COLOR_NEON_AMBER;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center energy beam
      ctx.strokeStyle = colorCore;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + 12, this.y + this.height - 2);
      ctx.lineTo(sx + 12, this.y + 8);
      ctx.stroke();

      // Tip glow
      ctx.fillStyle = COLOR_WHITE;
      ctx.beginPath();
      ctx.arc(sx + 12, this.y + 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class SecurityDrone extends BaseObstacle {
  public altitudeType: 'low' | 'high';
  private baseY: number;
  private margin = 4;

  constructor(x: number, altitudeType: 'low' | 'high' = 'mid' as unknown as 'low') {
    const width = 44;
    const height = 30;
    const baseAltitude = altitudeType === 'low' ? 'low' : 'high';
    const baseY = baseAltitude === 'low' ? GROUND_Y - 58 : GROUND_Y - 96;

    super(x, baseY, width, height, "drone");
    this.altitudeType = baseAltitude;
    this.baseY = baseY;
    this.updateRect();
  }

  public override update(dt: number, worldSpeed: number): void {
    super.update(dt, worldSpeed);
    const hoverOffset = Math.sin(this.animTimer * 6.0) * 4.0;
    this.y = this.baseY + hoverOffset;
    this.updateRect();
  }

  protected override updateRect(): void {
    this.rect = {
      x: Math.floor(this.x + this.margin),
      y: Math.floor(this.y + this.margin),
      width: this.width - this.margin * 2,
      height: this.height - this.margin * 2
    };
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const centerX = Math.floor(this.x + this.width / 2);
    const centerY = Math.floor(this.y + 15);

    // Downward scanning cone
    const scannerAlpha = (40 + 25 * Math.sin(this.animTimer * 10)) / 255.0;
    ctx.fillStyle = `rgba(255, 34, 68, ${scannerAlpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 8);
    ctx.lineTo(centerX - 18, this.y + this.height + 25);
    ctx.lineTo(centerX + 18, this.y + this.height + 25);
    ctx.closePath();
    ctx.fill();

    // Drone Main Body
    ctx.fillStyle = COLOR_SURFACE;
    ctx.beginPath();
    ctx.roundRect(centerX - 16, centerY - 8, 32, 16, 4);
    ctx.fill();

    ctx.strokeStyle = COLOR_NEON_PINK;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glowing Red Sensor Eye
    const eyeBlink = Math.floor(this.animTimer * 8) % 2 === 0;
    ctx.fillStyle = eyeBlink ? COLOR_WHITE : COLOR_NEON_RED;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Micro thrusters on sides
    const rotorPhase = this.animTimer * 20.0;
    const rotorW = Math.max(2, Math.floor(Math.abs(Math.sin(rotorPhase)) * 10));

    ctx.strokeStyle = COLOR_NEON_CYAN;
    ctx.lineWidth = 2;
    // Left rotor
    ctx.beginPath();
    ctx.moveTo(centerX - 20 - rotorW, centerY - 6);
    ctx.lineTo(centerX - 20 + rotorW, centerY - 6);
    ctx.stroke();

    // Right rotor
    ctx.beginPath();
    ctx.moveTo(centerX + 20 - rotorW, centerY - 6);
    ctx.lineTo(centerX + 20 + rotorW, centerY - 6);
    ctx.stroke();

    ctx.restore();
  }
}

export class DataPylon extends BaseObstacle {
  private marginX = 3;
  private marginY = 2;

  constructor(x: number) {
    const width = 30;
    const height = 62;
    const y = GROUND_Y - height;
    super(x, y, width, height, "pylon");
    this.updateRect();
  }

  protected override updateRect(): void {
    this.rect = {
      x: Math.floor(this.x + this.marginX),
      y: Math.floor(this.y + this.marginY),
      width: this.width - this.marginX * 2,
      height: this.height - this.marginY
    };
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Pillar structure
    ctx.fillStyle = COLOR_SURFACE;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 2);
    ctx.fill();

    ctx.strokeStyle = COLOR_NEON_PURPLE;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Server drive slots with blinking LEDs
    for (let slot = 0; slot < 4; slot++) {
      const slotY = this.y + 8 + slot * 12;
      ctx.strokeStyle = "#2d3748";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x + 4, slotY);
      ctx.lineTo(this.x + this.width - 4, slotY);
      ctx.stroke();

      const ledColor = (Math.floor(this.animTimer * 6) + slot) % 3 === 0 ? COLOR_NEON_GREEN : COLOR_NEON_CYAN;
      ctx.fillStyle = ledColor;
      ctx.fillRect(this.x + this.width - 7, slotY - 2, 3, 3);
    }

    // Top electrode
    ctx.fillStyle = COLOR_WHITE;
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + 4, 3, 0, Math.PI * 2);
    ctx.fill();

    if (Math.floor(this.animTimer * 12) % 2 === 0) {
      ctx.strokeStyle = COLOR_NEON_CYAN;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2 - 4, this.y + 2);
      ctx.lineTo(this.x + this.width / 2 + 8, this.y + 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class LaserBarrier extends BaseObstacle {
  private marginX = 2;
  private marginY = 4;

  constructor(x: number) {
    const width = 70;
    const height = 36;
    const y = GROUND_Y - 60; // Suspended overhead (duck/slide under)
    super(x, y, width, height, "laser");
    this.updateRect();
  }

  protected override updateRect(): void {
    this.rect = {
      x: Math.floor(this.x + this.marginX),
      y: Math.floor(this.y + this.marginY),
      width: this.width - this.marginX * 2,
      height: this.height - this.marginY * 2
    };
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Left & right emitter nodes
    ctx.fillStyle = COLOR_SURFACE;
    ctx.fillRect(this.x, this.y + 4, 10, 24);
    ctx.strokeStyle = COLOR_NEON_RED;
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y + 4, 10, 24);

    ctx.fillRect(this.x + this.width - 10, this.y + 4, 10, 24);
    ctx.strokeRect(this.x + this.width - 10, this.y + 4, 10, 24);

    // Glowing Laser Beams
    const beamY1 = this.y + 12;
    const beamY2 = this.y + 20;

    // Laser 1
    ctx.strokeStyle = COLOR_NEON_RED;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.x + 10, beamY1);
    ctx.lineTo(this.x + this.width - 10, beamY1);
    ctx.stroke();

    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x + 10, beamY1);
    ctx.lineTo(this.x + this.width - 10, beamY1);
    ctx.stroke();

    // Laser 2
    ctx.strokeStyle = COLOR_NEON_RED;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.x + 10, beamY2);
    ctx.lineTo(this.x + this.width - 10, beamY2);
    ctx.stroke();

    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x + 10, beamY2);
    ctx.lineTo(this.x + this.width - 10, beamY2);
    ctx.stroke();

    // Electricity crackle
    if (Math.floor(this.animTimer * 15) % 2 === 0) {
      const midX = this.x + 16 + Math.random() * (this.width - 32);
      ctx.strokeStyle = COLOR_NEON_CYAN;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(midX, beamY1);
      ctx.lineTo(midX + (Math.random() * 8 - 4), beamY2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class GlitchNode extends BaseObstacle {
  constructor(x: number) {
    const width = 36;
    const height = 36;
    const y = GROUND_Y - height;
    super(x, y, width, height, "glitch");
    this.updateRect();
  }

  protected override updateRect(): void {
    this.rect = {
      x: Math.floor(this.x + 3),
      y: Math.floor(this.y + 3),
      width: this.width - 6,
      height: this.height - 6
    };
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const offsetX = Math.random() < 0.25 ? (Math.random() < 0.5 ? -2 : 2) : 0;
    const offsetY = Math.random() < 0.25 ? (Math.random() < 0.5 ? -1 : 1) : 0;

    const rx = this.x + offsetX;
    const ry = this.y + offsetY;

    ctx.fillStyle = "#140a1e";
    ctx.fillRect(rx, ry, this.width, this.height);

    ctx.strokeStyle = COLOR_NEON_PINK;
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, ry, this.width, this.height);

    // Inner cross
    ctx.strokeStyle = COLOR_NEON_CYAN;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx, ry + this.height / 2);
    ctx.lineTo(rx + this.width, ry + this.height / 2);
    ctx.moveTo(rx + this.width / 2, ry);
    ctx.lineTo(rx + this.width / 2, ry + this.height);
    ctx.stroke();

    ctx.restore();
  }
}

export class ObstacleSpawner {
  public obstacles: BaseObstacle[] = [];
  public spawnDistanceTracker: number = 0.0;
  public nextSpawnDistance: number = 450.0;

  public clear(): void {
    this.obstacles = [];
    this.spawnDistanceTracker = 0.0;
    this.nextSpawnDistance = 450.0;
  }

  public update(dt: number, worldSpeed: number, totalDistance: number): void {
    for (const obs of this.obstacles) {
      obs.update(dt, worldSpeed);
    }

    // Remove off-screen obstacles
    this.obstacles = this.obstacles.filter(obs => obs.x + obs.width > -50);

    // Calculate spawn timing
    this.spawnDistanceTracker += worldSpeed * dt * 60.0;

    if (this.spawnDistanceTracker >= this.nextSpawnDistance) {
      this.spawnObstacle(totalDistance, worldSpeed);
      this.spawnDistanceTracker = 0.0;
      const minDist = Math.max(300, Math.floor(220 + worldSpeed * 18));
      const maxDist = minDist + 120 + Math.floor(Math.random() * 160);
      this.nextSpawnDistance = minDist + Math.random() * (maxDist - minDist);
    }
  }

  public spawnObstacle(totalDistance: number, _worldSpeed: number): void {
    const spawnX = SCREEN_WIDTH + 40;
    const availableTypes: string[] = ["spikes_1", "glitch"];

    if (totalDistance >= 600) {
      availableTypes.push("spikes_2", "drone_high");
    }
    if (totalDistance >= 1500) {
      availableTypes.push("drone_low", "pylon");
    }
    if (totalDistance >= 2800) {
      availableTypes.push("laser", "spikes_3");
    }

    const choice = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    let obs: BaseObstacle;

    if (choice === "spikes_1") {
      obs = new FirewallSpikes(spawnX, 1);
    } else if (choice === "spikes_2") {
      obs = new FirewallSpikes(spawnX, 2);
    } else if (choice === "spikes_3") {
      obs = new FirewallSpikes(spawnX, 3);
    } else if (choice === "drone_high") {
      obs = new SecurityDrone(spawnX, "high");
    } else if (choice === "drone_low") {
      obs = new SecurityDrone(spawnX, "low");
    } else if (choice === "pylon") {
      obs = new DataPylon(spawnX);
    } else if (choice === "laser") {
      obs = new LaserBarrier(spawnX);
    } else {
      obs = new GlitchNode(spawnX);
    }

    this.obstacles.push(obs);
  }

  public checkCollision(playerRect: Rect): BaseObstacle | null {
    for (const obs of this.obstacles) {
      if (
        playerRect.x < obs.rect.x + obs.rect.width &&
        playerRect.x + playerRect.width > obs.rect.x &&
        playerRect.y < obs.rect.y + obs.rect.height &&
        playerRect.y + playerRect.height > obs.rect.y
      ) {
        return obs;
      }
    }
    return null;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const obs of this.obstacles) {
      obs.draw(ctx);
    }
  }
}
