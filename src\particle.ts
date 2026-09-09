/**
 * Particle and Visual Effects Engine for Terminal Runner (HTML5 Canvas)
 * Renders retro sparks, pixel debris, expanding shockwave rings, and floating score texts.
 */

import {
  COLOR_NEON_GREEN, COLOR_NEON_CYAN, COLOR_NEON_PINK,
  COLOR_NEON_AMBER, COLOR_NEON_PURPLE, COLOR_NEON_RED, COLOR_WHITE
} from './config.ts';
import { ParticleItem, FloatingTextItem } from './types.ts';

export class ParticleManager {
  private particles: ParticleItem[] = [];
  private floatingTexts: FloatingTextItem[] = [];

  public clear(): void {
    this.particles = [];
    this.floatingTexts = [];
  }

  public addFloatingText(text: string, x: number, y: number, color: string = COLOR_NEON_GREEN, size: number = 16): void {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      size,
      life: 1.0,
      maxLife: 1.0,
      alive: true
    });
  }

  public emitRunSparks(x: number, y: number): void {
    const count = Math.random() < 0.5 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const vx = -(2.0 + Math.random() * 3.0);
      const vy = -(0.5 + Math.random() * 2.0);
      const colors = [COLOR_NEON_GREEN, COLOR_NEON_CYAN, "#c8ffdc"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 1.5 + Math.random() * 1.5;
      const life = 0.15 + Math.random() * 0.15;
      this.particles.push({
        x,
        y,
        vx,
        vy,
        color,
        initialSize: size,
        size,
        life,
        maxLife: life,
        shape: 'rect',
        gravity: 0.25,
        drag: 0.98,
        fade: true,
        shrink: true,
        alive: true
      });
    }
  }

  public emitJumpBurst(x: number, y: number): void {
    // Shockwave ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color: COLOR_NEON_CYAN,
      initialSize: 8.0,
      size: 8.0,
      life: 0.25,
      maxLife: 0.25,
      shape: 'ring',
      gravity: 0,
      drag: 1,
      fade: true,
      shrink: false,
      alive: true
    });

    // Downward sparks
    for (let i = 0; i < 12; i++) {
      const vx = -3.0 + Math.random() * 4.0;
      const vy = 2.5 + Math.random() * 3.5;
      const colors = [COLOR_NEON_CYAN, COLOR_NEON_GREEN, COLOR_WHITE];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 2.0 + Math.random() * 2.0;
      const life = 0.2 + Math.random() * 0.2;
      this.particles.push({
        x: x - 8 + Math.random() * 16,
        y,
        vx,
        vy,
        color,
        initialSize: size,
        size,
        life,
        maxLife: life,
        shape: 'spark',
        gravity: 0.15,
        drag: 0.98,
        fade: true,
        shrink: true,
        alive: true
      });
    }
  }

  public emitDuckSparks(x: number, y: number): void {
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const vx = -(3.5 + Math.random() * 4.5);
      const vy = -(0.8 + Math.random() * 2.4);
      const colors = [COLOR_NEON_AMBER, COLOR_NEON_PINK, COLOR_WHITE];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 1.8 + Math.random() * 1.7;
      const life = 0.18 + Math.random() * 0.17;
      this.particles.push({
        x,
        y,
        vx,
        vy,
        color,
        initialSize: size,
        size,
        life,
        maxLife: life,
        shape: 'rect',
        gravity: 0.4,
        drag: 0.98,
        fade: true,
        shrink: true,
        alive: true
      });
    }
  }

  public emitCollectSparkles(x: number, y: number, color: string = COLOR_NEON_CYAN): void {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color,
      initialSize: 12.0,
      size: 12.0,
      life: 0.3,
      maxLife: 0.3,
      shape: 'ring',
      gravity: 0,
      drag: 1,
      fade: true,
      shrink: false,
      alive: true
    });

    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 4.0;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 2.0 + Math.random() * 2.0;
      const life = 0.3 + Math.random() * 0.3;
      const colors = [color, COLOR_WHITE, "#f0ffff"];
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x,
        y,
        vx,
        vy,
        color: c,
        initialSize: size,
        size,
        life,
        maxLife: life,
        shape: 'spark',
        gravity: 0,
        drag: 0.92,
        fade: true,
        shrink: true,
        alive: true
      });
    }
  }

  public emitPowerupFlash(x: number, y: number, color: string): void {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color,
      initialSize: 20.0,
      size: 20.0,
      life: 0.45,
      maxLife: 0.45,
      shape: 'ring',
      gravity: 0,
      drag: 1,
      fade: true,
      shrink: false,
      alive: true
    });

    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.0 + Math.random() * 5.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 3.0 + Math.random() * 3.0;
      const life = 0.4 + Math.random() * 0.35;
      this.particles.push({
        x,
        y,
        vx,
        vy,
        color,
        initialSize: size,
        size,
        life,
        maxLife: life,
        shape: 'spark',
        gravity: 0,
        drag: 0.94,
        fade: true,
        shrink: true,
        alive: true
      });
    }
  }

  public emitShieldBreak(x: number, y: number): void {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color: COLOR_NEON_CYAN,
      initialSize: 24.0,
      size: 24.0,
      life: 0.35,
      maxLife: 0.35,
      shape: 'ring',
      gravity: 0,
      drag: 1,
      fade: true,
      shrink: false,
      alive: true
    });

    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.0 + Math.random() * 6.0;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 2.5 + Math.random() * 2.5;
      const life = 0.35 + Math.random() * 0.35;
      const colors = [COLOR_NEON_CYAN, COLOR_NEON_PURPLE, COLOR_WHITE];
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x,
        y,
        vx,
        vy,
        color: c,
        initialSize: size,
        size,
        life,
        maxLife: life,
        shape: 'rect',
        gravity: 0.1,
        drag: 0.95,
        fade: true,
        shrink: true,
        alive: true
      });
    }
  }

  public emitPlayerCrash(x: number, y: number): void {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color: COLOR_NEON_RED,
      initialSize: 30.0,
      size: 30.0,
      life: 0.5,
      maxLife: 0.5,
      shape: 'ring',
      gravity: 0,
      drag: 1,
      fade: true,
      shrink: false,
      alive: true
    });

    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 9.0;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 2.0;
      const size = 3.0 + Math.random() * 4.0;
      const life = 0.6 + Math.random() * 0.6;
      const colors = [COLOR_NEON_GREEN, COLOR_NEON_RED, COLOR_NEON_AMBER, COLOR_WHITE];
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x,
        y,
        vx,
        vy,
        color: c,
        initialSize: size,
        size,
        life,
        maxLife: life,
        shape: 'rect',
        gravity: 0.35,
        drag: 0.96,
        fade: true,
        shrink: true,
        alive: true
      });
    }
  }

  public update(dt: number, worldSpeed: number = 0.0): void {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += (p.vx - worldSpeed) * dt * 60.0;
      p.y += p.vy * dt * 60.0;
      p.vy += p.gravity * dt * 60.0;
      p.vx *= Math.pow(p.drag, dt * 60.0);
      p.vy *= Math.pow(p.drag, dt * 60.0);

      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        this.particles.splice(i, 1);
        continue;
      }

      if (p.shrink) {
        const progress = 1.0 - (p.life / p.maxLife);
        p.size = Math.max(0.5, p.initialSize * (1.0 - progress));
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 35.0 * dt;
      ft.x -= worldSpeed * 0.4 * dt * 60.0;
      ft.life -= dt;
      if (ft.life <= 0) {
        ft.alive = false;
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // Render particles
    for (const p of this.particles) {
      if (!p.alive || p.size <= 0.5) continue;

      ctx.save();
      let alpha = 1.0;
      if (p.fade) {
        alpha = Math.max(0.0, Math.min(1.0, p.life / p.maxLife));
      }
      ctx.globalAlpha = alpha;

      const s = p.size;

      if (p.shape === 'rect') {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - s, p.y - s, s * 2, s * 2);
      } else if (p.shape === 'circle') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, Math.floor(s / 2));
        ctx.beginPath();
        ctx.moveTo(p.x - s, p.y);
        ctx.lineTo(p.x + s, p.y);
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x, p.y + s);
        ctx.stroke();
      } else if (p.shape === 'ring') {
        const progress = 1.0 - (p.life / p.maxLife);
        const radius = p.initialSize * (1.0 + progress * 2.5);
        if (radius > 1) {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1, Math.floor(p.size / 2));
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // Render floating texts
    for (const ft of this.floatingTexts) {
      if (!ft.alive) continue;

      ctx.save();
      const alpha = Math.max(0.0, Math.min(1.0, ft.life / ft.maxLife));
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${ft.size}px "Share Tech Mono", "Consolas", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);

      // Main Text
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);

      ctx.restore();
    }
  }
}
