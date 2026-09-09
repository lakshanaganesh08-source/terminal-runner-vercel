/**
 * User Interface, HUD, CRT Scanline Overlay, and Menu Screens for Terminal Runner (HTML5 Canvas)
 */

import {
  SCREEN_WIDTH, SCREEN_HEIGHT, COLOR_NEON_GREEN, COLOR_NEON_CYAN,
  COLOR_NEON_AMBER, COLOR_NEON_PURPLE, COLOR_NEON_RED,
  COLOR_WHITE, COLOR_DIM
} from './config.ts';
import { Player } from './player.ts';
import { PowerUpManager } from './powerup.ts';

export class UIManager {
  public cursorTimer: number = 0.0;

  public update(dt: number): void {
    this.cursorTimer += dt;
  }

  public drawHUD(
    ctx: CanvasRenderingContext2D,
    score: number,
    highScore: number,
    powerupMgr: PowerUpManager,
    player: Player,
    _worldSpeed: number
  ): void {
    ctx.save();
    ctx.font = 'bold 20px "Share Tech Mono", "Consolas", monospace';
    ctx.textBaseline = "top";

    // Top-Left: High Score
    ctx.fillStyle = COLOR_DIM;
    ctx.textAlign = "left";
    const hiText = `HI ${highScore.toString().padStart(6, '0')}`;
    ctx.fillText(hiText, 24, 16);

    // Top-Right: Current Score
    const scoreColor = !powerupMgr.isDoubleScore ? COLOR_NEON_GREEN : COLOR_NEON_AMBER;
    ctx.fillStyle = scoreColor;
    ctx.textAlign = "right";
    const scoreText = `SCORE ${score.toString().padStart(6, '0')}`;
    ctx.fillText(scoreText, SCREEN_WIDTH - 24, 16);

    // Center Status Badges
    let badgeX = Math.floor(SCREEN_WIDTH / 2 - 120);
    const badgeY = 14;

    // 1. Shield Badge
    if (player.hasShield) {
      this.drawBadge(ctx, badgeX, badgeY, "SHIELD", COLOR_NEON_CYAN, 1.0);
      badgeX += 90;
    }

    // 2. 2X Multiplier Badge
    if (powerupMgr.isDoubleScore) {
      const ratio = powerupMgr.doubleScoreTimer / 10.0;
      this.drawBadge(ctx, badgeX, badgeY, `2X ${powerupMgr.doubleScoreTimer.toFixed(1)}s`, COLOR_NEON_AMBER, ratio);
      badgeX += 90;
    }

    // 3. Slow-Mo Badge
    if (powerupMgr.isSlowMotion) {
      const ratio = powerupMgr.slowMotionTimer / 8.0;
      this.drawBadge(ctx, badgeX, badgeY, `SLOW ${powerupMgr.slowMotionTimer.toFixed(1)}s`, COLOR_NEON_PURPLE, ratio);
    }

    ctx.restore();
  }

  private drawBadge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    color: string,
    progress: number
  ): void {
    const bw = 82;
    const bh = 22;

    ctx.fillStyle = "rgba(15, 20, 28, 0.88)";
    ctx.beginPath();
    ctx.roundRect(x, y, bw, bh, 4);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Progress bar fill at bottom
    const fillW = Math.max(2, Math.floor((bw - 4) * progress));
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, y + bh - 3, fillW, 2);

    // Text label
    ctx.font = 'bold 12px "Share Tech Mono", "Consolas", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + bw / 2, y + (bh - 2) / 2);
  }

  public drawStartScreen(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Dark backdrop overlay
    ctx.fillStyle = "rgba(8, 12, 18, 0.72)";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Title Box
    const boxW = 640;
    const boxH = 240;
    const boxX = Math.floor(SCREEN_WIDTH / 2 - boxW / 2);
    const boxY = Math.floor(SCREEN_HEIGHT / 2 - boxH / 2);

    ctx.fillStyle = "rgba(15, 20, 28, 0.94)";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();

    ctx.strokeStyle = COLOR_NEON_GREEN;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Header Title
    ctx.fillStyle = COLOR_NEON_GREEN;
    ctx.font = 'bold 38px "Share Tech Mono", "Consolas", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TERMINAL RUNNER", SCREEN_WIDTH / 2, boxY + 45);

    // Subtitle
    ctx.fillStyle = COLOR_DIM;
    ctx.font = '13px "Share Tech Mono", "Consolas", monospace';
    ctx.fillText("[v1.0.0 // CYBERNETIC PROTOCOL ACTIVE]", SCREEN_WIDTH / 2, boxY + 80);

    // Blinking prompt
    const cursorVisible = Math.floor(this.cursorTimer * 2.5) % 2 === 0;
    const promptText = cursorVisible ? "> PRESS [SPACE] OR [UP] TO INITIATE <" : "  PRESS [SPACE] OR [UP] TO INITIATE  ";
    ctx.fillStyle = COLOR_NEON_CYAN;
    ctx.font = 'bold 18px "Share Tech Mono", "Consolas", monospace';
    ctx.fillText(promptText, SCREEN_WIDTH / 2, boxY + 130);

    // Controls description
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = '13px "Share Tech Mono", "Consolas", monospace';
    ctx.fillText("[SPACE/UP] JUMP  |  [DOWN] DUCK / SLIDE  |  [P/ESC] PAUSE  |  [R] RESTART", SCREEN_WIDTH / 2, boxY + boxH - 30);

    ctx.restore();
  }

  public drawPauseScreen(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = "rgba(8, 12, 18, 0.78)";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const boxW = 460;
    const boxH = 160;
    const boxX = Math.floor(SCREEN_WIDTH / 2 - boxW / 2);
    const boxY = Math.floor(SCREEN_HEIGHT / 2 - boxH / 2);

    ctx.fillStyle = "rgba(15, 20, 28, 0.95)";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();

    ctx.strokeStyle = COLOR_NEON_CYAN;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = COLOR_NEON_CYAN;
    ctx.font = 'bold 36px "Share Tech Mono", "Consolas", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SYSTEM PAUSED", SCREEN_WIDTH / 2, boxY + 45);

    ctx.fillStyle = COLOR_WHITE;
    ctx.font = 'bold 16px "Share Tech Mono", "Consolas", monospace';
    ctx.fillText("PRESS [P] OR [ESC] TO RESUME", SCREEN_WIDTH / 2, boxY + 95);

    ctx.fillStyle = COLOR_DIM;
    ctx.font = '13px "Share Tech Mono", "Consolas", monospace';
    ctx.fillText("PRESS [R] TO REBOOT SYSTEM", SCREEN_WIDTH / 2, boxY + boxH - 22);

    ctx.restore();
  }

  public drawGameOverScreen(
    ctx: CanvasRenderingContext2D,
    score: number,
    highScore: number,
    distance: number,
    packetsCollected: number,
    isNewRecord: boolean
  ): void {
    ctx.save();
    ctx.fillStyle = "rgba(16, 8, 12, 0.85)";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const boxW = 560;
    const boxH = 260;
    const boxX = Math.floor(SCREEN_WIDTH / 2 - boxW / 2);
    const boxY = Math.floor(SCREEN_HEIGHT / 2 - boxH / 2);

    ctx.fillStyle = "rgba(20, 14, 20, 0.96)";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();

    ctx.strokeStyle = COLOR_NEON_RED;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Header
    ctx.fillStyle = COLOR_NEON_RED;
    ctx.font = 'bold 36px "Share Tech Mono", "Consolas", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SYSTEM FAILURE", SCREEN_WIDTH / 2, boxY + 40);

    // New high score banner
    if (isNewRecord) {
      ctx.fillStyle = COLOR_NEON_AMBER;
      ctx.font = 'bold 14px "Share Tech Mono", "Consolas", monospace';
      ctx.fillText("*** NEW HIGH SCORE ESTABLISHED ***", SCREEN_WIDTH / 2, boxY + 75);
    }

    // Stats
    const line1 = `FINAL SCORE : ${score.toString().padStart(6, '0')}     HIGH SCORE : ${highScore.toString().padStart(6, '0')}`;
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = 'bold 17px "Share Tech Mono", "Consolas", monospace';
    ctx.fillText(line1, SCREEN_WIDTH / 2, boxY + 110);

    const line2 = `DISTANCE : ${Math.floor(distance)} m     DATA PACKETS : ${packetsCollected}`;
    ctx.fillStyle = COLOR_DIM;
    ctx.font = '14px "Share Tech Mono", "Consolas", monospace';
    ctx.fillText(line2, SCREEN_WIDTH / 2, boxY + 145);

    // Restart prompt
    const cursorVisible = Math.floor(this.cursorTimer * 3.0) % 2 === 0;
    const promptText = cursorVisible ? "> PRESS [R] OR [SPACE] TO RESTART <" : "  PRESS [R] OR [SPACE] TO RESTART  ";
    ctx.fillStyle = COLOR_NEON_GREEN;
    ctx.font = 'bold 18px "Share Tech Mono", "Consolas", monospace';
    ctx.fillText(promptText, SCREEN_WIDTH / 2, boxY + boxH - 42);

    ctx.restore();
  }

  public drawScanlines(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 1;

    for (let y = 0; y < SCREEN_HEIGHT; y += 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(SCREEN_WIDTH, y);
      ctx.stroke();
    }

    // Vignette border
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.restore();
  }
}
