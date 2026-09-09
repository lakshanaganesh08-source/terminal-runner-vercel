/**
 * Main Game Loop, State Machine, and Systems Coordinator for Terminal Runner (HTML5 Canvas)
 */

import {
  SCREEN_WIDTH, SCREEN_HEIGHT,
  INITIAL_WORLD_SPEED, MAX_WORLD_SPEED, SPEED_INCREASE_RATE,
  POINTS_PER_PIXEL, COLOR_BG
} from './config.ts';
import { GameState } from './types.ts';
import { Player } from './player.ts';
import { ObstacleSpawner } from './obstacle.ts';
import { CollectibleSpawner } from './collectible.ts';
import { PowerUpManager } from './powerup.ts';
import { Background } from './background.ts';
import { ParticleManager } from './particle.ts';
import { AudioManager } from './audio.ts';
import { UIManager } from './ui.ts';
import { StorageManager } from './storage.ts';

export class Game {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  public audio: AudioManager;
  public particles: ParticleManager;
  public background: Background;
  public ui: UIManager;
  public player: Player;
  public obstacleSpawner: ObstacleSpawner;
  public collectibleSpawner: CollectibleSpawner;
  public powerupMgr: PowerUpManager;
  public storage: StorageManager;

  // Game State
  public state: GameState = GameState.START;
  public score: number = 0;
  public scoreFloat: number = 0.0;
  public highScore: number = 0;
  public isNewRecord: boolean = false;
  public distance: number = 0.0;
  public worldSpeed: number = INITIAL_WORLD_SPEED;
  public packetsCollected: number = 0;

  // Camera Shake
  public shakeDuration: number = 0.0;
  public shakeMagnitude: number = 0.0;

  // Loop control
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error("Unable to obtain 2D rendering context for canvas");
    }
    this.ctx = context;

    // Set virtual resolution
    this.canvas.width = SCREEN_WIDTH;
    this.canvas.height = SCREEN_HEIGHT;

    // Initialize systems
    this.audio = new AudioManager();
    this.particles = new ParticleManager();
    this.background = new Background();
    this.ui = new UIManager();
    this.player = new Player();
    this.obstacleSpawner = new ObstacleSpawner();
    this.collectibleSpawner = new CollectibleSpawner();
    this.powerupMgr = new PowerUpManager();
    this.storage = new StorageManager();

    this.highScore = this.storage.getHighScore();
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public startNewGame(): void {
    this.state = GameState.PLAYING;
    this.score = 0;
    this.scoreFloat = 0.0;
    this.distance = 0.0;
    this.worldSpeed = INITIAL_WORLD_SPEED;
    this.packetsCollected = 0;
    this.isNewRecord = false;
    this.shakeDuration = 0.0;
    this.shakeMagnitude = 0.0;

    this.player.reset();
    this.obstacleSpawner.clear();
    this.collectibleSpawner.clear();
    this.powerupMgr.reset();
    this.particles.clear();
    this.background.reset();

    this.audio.play("ui_beep");
  }

  public togglePause(): void {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.audio.play("pause");
    } else if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.audio.play("ui_beep");
    }
  }

  public triggerShake(magnitude: number = 6.0, duration: number = 0.25): void {
    this.shakeMagnitude = magnitude;
    this.shakeDuration = duration;
  }

  public update(dt: number): void {
    // Clamp delta time to avoid physics tunneling on lag spikes
    const clampedDt = Math.min(dt, 0.05);

    this.ui.update(clampedDt);

    if (this.state === GameState.PAUSED) {
      return;
    }

    // Update screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= clampedDt;
      if (this.shakeDuration <= 0) {
        this.shakeMagnitude = 0.0;
      }
    }

    if (this.state === GameState.PLAYING) {
      // Calculate world speed based on progression & slow-motion
      const baseSpeed = Math.min(MAX_WORLD_SPEED, INITIAL_WORLD_SPEED + this.distance * SPEED_INCREASE_RATE);
      const effectiveSpeed = baseSpeed * this.powerupMgr.speedMultiplier;
      this.worldSpeed = effectiveSpeed;

      // Distance & continuous score
      const distDelta = effectiveSpeed * clampedDt * 60.0;
      this.distance += distDelta;
      this.scoreFloat += distDelta * POINTS_PER_PIXEL * this.powerupMgr.scoreMultiplier;
      this.score = Math.floor(this.scoreFloat);

      // Check new high score during active run
      if (this.score > this.highScore) {
        if (!this.isNewRecord && this.highScore > 0) {
          this.particles.addFloatingText("NEW RECORD!", SCREEN_WIDTH / 2, 80, "#ffd700", 20);
        }
        this.highScore = this.score;
        this.isNewRecord = true;
      }

      // Update game entities
      this.background.update(clampedDt, effectiveSpeed, this.distance);
      this.player.update(clampedDt, this.particles, this.audio);
      this.obstacleSpawner.update(clampedDt, effectiveSpeed, this.distance);
      this.collectibleSpawner.update(clampedDt, effectiveSpeed, this.distance);
      this.powerupMgr.update(clampedDt, effectiveSpeed, this.player, this.distance);
      this.particles.update(clampedDt, effectiveSpeed);

      // 1. Check Collectibles Collision
      const earnedPts = this.collectibleSpawner.checkCollection(
        this.player.rect,
        this.powerupMgr.scoreMultiplier,
        this.particles,
        this.audio
      );
      if (earnedPts > 0) {
        this.scoreFloat += earnedPts;
        this.score = Math.floor(this.scoreFloat);
        this.packetsCollected += 1;
        if (this.score > this.highScore) {
          this.highScore = this.score;
          this.isNewRecord = true;
        }
      }

      // 2. Check Power-Ups Collision
      this.powerupMgr.checkCollection(this.player, this.particles, this.audio);

      // 3. Check Obstacles Collision
      const collidingObs = this.obstacleSpawner.checkCollision(this.player.rect);
      if (collidingObs) {
        const fatal = this.player.applyHit();
        if (fatal) {
          // Crash & Game Over
          this.state = GameState.GAME_OVER;
          this.triggerShake(12.0, 0.45);
          this.particles.emitPlayerCrash(this.player.x + 20, this.player.y + 25);
          this.audio.play("crash");
          this.storage.saveHighScore(this.highScore);
          this.storage.recordRun(this.score, this.distance, this.packetsCollected);
        } else {
          // Shield absorbed hit
          this.triggerShake(5.0, 0.20);
          this.particles.emitShieldBreak(this.player.x + 20, this.player.y + 25);
          this.particles.addFloatingText("SHIELD BROKEN!", this.player.x, this.player.y - 20, "#ff6464", 16);
          this.audio.play("shield_break");
        }
      }
    } else if (this.state === GameState.START || this.state === GameState.GAME_OVER) {
      // Gentle ambient background animation on menus
      this.background.update(clampedDt, 2.0, 0.0);
      this.player.update(clampedDt, this.particles, this.audio);
      this.particles.update(clampedDt, 2.0);
    }
  }

  public draw(): void {
    this.ctx.save();

    // Apply Camera Screen Shake
    if (this.shakeDuration > 0 && this.shakeMagnitude > 0) {
      const shakeX = (Math.random() * 2 - 1) * this.shakeMagnitude;
      const shakeY = (Math.random() * 2 - 1) * this.shakeMagnitude;
      this.ctx.translate(shakeX, shakeY);
    }

    // 1. Clear Canvas
    this.ctx.fillStyle = COLOR_BG;
    this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 2. Background Layers
    this.background.draw(this.ctx, this.distance);

    // 3. Collectibles & Power-Ups
    this.collectibleSpawner.draw(this.ctx);
    this.powerupMgr.draw(this.ctx);

    // 4. Obstacles
    this.obstacleSpawner.draw(this.ctx);

    // 5. Player Sprite
    this.player.draw(this.ctx);

    // 6. Particles & Floating Texts
    this.particles.draw(this.ctx);

    // 7. HUD
    this.ui.drawHUD(this.ctx, this.score, this.highScore, this.powerupMgr, this.player, this.worldSpeed);

    // 8. Screen State Overlays
    if (this.state === GameState.START) {
      this.ui.drawStartScreen(this.ctx);
    } else if (this.state === GameState.PAUSED) {
      this.ui.drawPauseScreen(this.ctx);
    } else if (this.state === GameState.GAME_OVER) {
      this.ui.drawGameOverScreen(
        this.ctx, this.score, this.highScore,
        this.distance, this.packetsCollected, this.isNewRecord
      );
    }

    // 9. CRT Scanlines
    this.ui.drawScanlines(this.ctx);

    this.ctx.restore();
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    const dt = (currentTime - this.lastTime) / 1000.0;
    this.lastTime = currentTime;

    this.update(dt);
    this.draw();

    this.animationFrameId = requestAnimationFrame(this.loop);
  }
}
