/**
 * Parallax Environment and Cyberpunk Terminal Background Renderer (HTML5 Canvas)
 * Features 4-layer parallax scrolling, server skylines, matrix terminal data streams,
 * perspective grid floor, glowing cyber moon, and dynamic color theme cycles.
 */

import {
  SCREEN_WIDTH, SCREEN_HEIGHT, GROUND_Y, COLOR_BG,
  COLOR_GRID, COLOR_NEON_GREEN,
  COLOR_NEON_CYAN, COLOR_NEON_PINK, COLOR_NEON_AMBER, COLOR_WHITE
} from './config.ts';
import { Star, CityBuilding, DataStreamer } from './types.ts';

export class Background {
  public scrollSky: number = 0.0;
  public scrollCity: number = 0.0;
  public scrollData: number = 0.0;
  public scrollGround: number = 0.0;
  public themeTimer: number = 0.0;

  private stars: Star[] = [];
  private cityBuildings: CityBuilding[] = [];
  private cityWidth: number = 0;
  private dataStreamers: DataStreamer[] = [];
  private codeSnippets: string[] = [
    "01011001", "root@runner:~#", "sudo sysctl -p", "0xDEADBEEF",
    "chmod +x run.sh", "SIGKILL(9)", "200_OK", "404_NOT_FOUND",
    "malloc(0x400)", "gcc -O3 runner.c", "kernel::panic", "grep -rn 'speed'"
  ];

  constructor() {
    this.initStars();
    this.initCity();
    this.initStreamers();
  }

  private initStars(): void {
    this.stars = [];
    for (let i = 0; i < 55; i++) {
      this.stars.push({
        x: Math.floor(Math.random() * SCREEN_WIDTH),
        y: 10 + Math.floor(Math.random() * (GROUND_Y - 110)),
        size: Math.random() < 0.33 ? 1 : 2,
        twinkleSpeed: 2.0 + Math.random() * 4.0,
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }
  }

  private initCity(): void {
    this.cityBuildings = [];
    let cx = 0;
    while (cx < SCREEN_WIDTH + 300) {
      const bw = 45 + Math.floor(Math.random() * 50);
      const bh = 80 + Math.floor(Math.random() * 110);
      this.cityBuildings.push({
        x: cx,
        w: bw,
        h: bh,
        hasTower: Math.random() < 0.35,
        windowPattern: Math.floor(Math.random() * 4)
      });
      cx += bw + 4 + Math.floor(Math.random() * 14);
    }
    this.cityWidth = cx;
  }

  private initStreamers(): void {
    this.dataStreamers = [];
    for (let i = 0; i < 12; i++) {
      this.dataStreamers.push({
        text: this.codeSnippets[Math.floor(Math.random() * this.codeSnippets.length)],
        x: Math.floor(Math.random() * SCREEN_WIDTH),
        y: 40 + Math.floor(Math.random() * (GROUND_Y - 130)),
        speedMod: 0.3 + Math.random() * 0.3,
        alpha: 70 + Math.floor(Math.random() * 90)
      });
    }
  }

  public reset(): void {
    this.scrollSky = 0.0;
    this.scrollCity = 0.0;
    this.scrollData = 0.0;
    this.scrollGround = 0.0;
    this.themeTimer = 0.0;
  }

  public update(dt: number, worldSpeed: number, _totalDistance: number): void {
    this.themeTimer += dt;
    this.scrollSky = (this.scrollSky + worldSpeed * 0.05 * dt * 60.0) % SCREEN_WIDTH;
    this.scrollCity = (this.scrollCity + worldSpeed * 0.18 * dt * 60.0) % this.cityWidth;
    this.scrollGround = (this.scrollGround + worldSpeed * dt * 60.0) % 40.0;

    // Update floating data streamers
    for (const stream of this.dataStreamers) {
      stream.x -= worldSpeed * stream.speedMod * dt * 60.0;
      if (stream.x < -150) {
        stream.x = SCREEN_WIDTH + 20 + Math.floor(Math.random() * 130);
        stream.y = 40 + Math.floor(Math.random() * (GROUND_Y - 130));
        stream.text = this.codeSnippets[Math.floor(Math.random() * this.codeSnippets.length)];
      }
    }
  }

  public getCurrentThemeColor(totalDistance: number): string {
    const cycle = (totalDistance / 1200.0) % 4.0;
    if (cycle < 1.0) return COLOR_NEON_GREEN;
    if (cycle < 2.0) return COLOR_NEON_CYAN;
    if (cycle < 3.0) return COLOR_NEON_AMBER;
    return COLOR_NEON_PINK;
  }

  public draw(ctx: CanvasRenderingContext2D, totalDistance: number): void {
    const accentColor = this.getCurrentThemeColor(totalDistance);

    // 1. Sky & Cyber Moon
    this.drawSky(ctx, accentColor);

    // 2. Mainframe City Skyline
    this.drawCitySkyline(ctx, accentColor);

    // 3. Floating Terminal Streamers
    this.drawDataStreamers(ctx, accentColor);

    // 4. Perspective Grid Floor
    this.drawGroundGrid(ctx, accentColor);
  }

  private drawSky(ctx: CanvasRenderingContext2D, accentColor: string): void {
    ctx.save();
    // Sky background
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, SCREEN_WIDTH, GROUND_Y);

    // Vertical night gradient
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, "rgba(18, 24, 33, 0.45)");
    grad.addColorStop(1, "rgba(13, 17, 23, 0.95)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SCREEN_WIDTH, GROUND_Y);

    // Giant Cyber Moon / Mainframe Sphere
    const moonCx = SCREEN_WIDTH - 140;
    const moonCy = 95;
    const moonR = 42;

    // Outer glow
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.08;
    ctx.beginPath();
    ctx.arc(moonCx, moonCy, moonR + 14, 0, Math.PI * 2);
    ctx.fill();

    // Dark moon body
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "#141a24";
    ctx.beginPath();
    ctx.arc(moonCx, moonCy, moonR, 0, Math.PI * 2);
    ctx.fill();

    // Moon outline
    ctx.strokeStyle = accentColor;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Moon scanlines
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    for (let my = moonCy - moonR + 8; my < moonCy + moonR - 8; my += 6) {
      const halfW = Math.sqrt(moonR * moonR - (my - moonCy) * (my - moonCy)) - 4;
      ctx.beginPath();
      ctx.moveTo(moonCx - halfW, my);
      ctx.lineTo(moonCx + halfW, my);
      ctx.stroke();
    }

    // Stars
    ctx.fillStyle = COLOR_WHITE;
    for (const star of this.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(this.themeTimer * star.twinkleSpeed + star.twinkleOffset);
      const alpha = 0.35 + twinkle * 0.6;
      const starX = (star.x - this.scrollSky + SCREEN_WIDTH) % SCREEN_WIDTH;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(starX, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawCitySkyline(ctx: CanvasRenderingContext2D, accentColor: string): void {
    ctx.save();
    for (const b of this.cityBuildings) {
      let bx = b.x - this.scrollCity;
      while (bx < -b.w) bx += this.cityWidth;
      while (bx > SCREEN_WIDTH + b.w) bx -= this.cityWidth;

      const by = GROUND_Y - b.h;

      // Building Body
      ctx.fillStyle = "#12161e";
      ctx.fillRect(bx, by, b.w, b.h);
      ctx.strokeStyle = "#1e2632";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, b.w, b.h);

      // Server LEDs / Windows
      const cols = Math.max(1, Math.floor(b.w / 14));
      const rows = Math.max(1, Math.floor(b.h / 18));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const wx = bx + 6 + c * 14;
          const wy = by + 10 + r * 18;
          if ((c + r * 2 + b.windowPattern) % 4 === 0) {
            const ledColor = (r + c) % 3 === 0 ? accentColor : "#3c4b5f";
            ctx.fillStyle = ledColor;
            ctx.fillRect(wx, wy, 4, 6);
          }
        }
      }

      // Antenna with blinking beacon
      if (b.hasTower) {
        const tx = bx + b.w / 2;
        ctx.strokeStyle = "#2d3746";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx, by);
        ctx.lineTo(tx, by - 18);
        ctx.stroke();

        if (Math.floor(this.themeTimer * 3.0) % 2 === 0) {
          ctx.fillStyle = "#ff283c";
          ctx.beginPath();
          ctx.arc(tx, by - 18, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  private drawDataStreamers(ctx: CanvasRenderingContext2D, accentColor: string): void {
    ctx.save();
    ctx.font = '11px "Share Tech Mono", "Consolas", monospace';
    ctx.fillStyle = accentColor;

    for (const stream of this.dataStreamers) {
      ctx.globalAlpha = stream.alpha / 255.0;
      ctx.fillText(stream.text, Math.floor(stream.x), Math.floor(stream.y));
    }
    ctx.restore();
  }

  private drawGroundGrid(ctx: CanvasRenderingContext2D, accentColor: string): void {
    ctx.save();
    const floorH = SCREEN_HEIGHT - GROUND_Y;

    // Dark sub-surface
    ctx.fillStyle = "#0a0e14";
    ctx.fillRect(0, GROUND_Y, SCREEN_WIDTH, floorH);

    // Horizon Neon Laser Line
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(SCREEN_WIDTH, GROUND_Y);
    ctx.stroke();

    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(SCREEN_WIDTH, GROUND_Y);
    ctx.stroke();

    // Horizontal perspective grid lines
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const gy = GROUND_Y + Math.floor(i * i * 3.0);
      if (gy < SCREEN_HEIGHT) {
        const alpha = Math.max(0.08, (180 - i * 30) / 255.0);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(SCREEN_WIDTH, gy);
        ctx.stroke();
      }
    }

    // Vertical scrolling perspective lines
    const spacing = 40.0;
    const offset = this.scrollGround;
    ctx.strokeStyle = COLOR_GRID;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1;

    for (let gx = -spacing; gx < SCREEN_WIDTH + spacing * 2; gx += spacing) {
      const topX = gx - offset;
      const botX = topX - 35; // Tilted perspective
      ctx.beginPath();
      ctx.moveTo(topX, GROUND_Y + 1);
      ctx.lineTo(botX, SCREEN_HEIGHT);
      ctx.stroke();
    }

    ctx.restore();
  }
}
