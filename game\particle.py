"""
Particle and Visual Effects Engine for Terminal Runner
Handles retro sparks, pixel debris, shockwaves, and floating score popups.
"""

import math
import random
import pygame
from game.config import (
    COLOR_NEON_GREEN, COLOR_NEON_CYAN, COLOR_NEON_PINK,
    COLOR_NEON_AMBER, COLOR_NEON_PURPLE, COLOR_NEON_RED, COLOR_WHITE, COLOR_DIM
)


class Particle:
    """Individual particle with physics, color transitions, and lifetime."""

    def __init__(self, x: float, y: float, vx: float, vy: float,
                 color: tuple, size: float, life: float,
                 shape: str = "rect", gravity: float = 0.0, drag: float = 0.98,
                 fade: bool = True, shrink: bool = True):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.color = color
        self.initial_size = size
        self.size = size
        self.life = life
        self.max_life = life
        self.shape = shape  # "rect", "circle", "spark", "ring"
        self.gravity = gravity
        self.drag = drag
        self.fade = fade
        self.shrink = shrink
        self.alive = True

    def update(self, dt: float, world_speed: float = 0.0):
        """Updates particle position, physics, and life."""
        self.x += (self.vx - world_speed) * dt * 60.0
        self.y += self.vy * dt * 60.0
        self.vy += self.gravity * dt * 60.0
        self.vx *= (self.drag ** (dt * 60.0))
        self.vy *= (self.drag ** (dt * 60.0))

        self.life -= dt
        if self.life <= 0:
            self.alive = False
            return

        progress = 1.0 - (self.life / self.max_life)
        if self.shrink:
            self.size = max(0.5, self.initial_size * (1.0 - progress))

    def draw(self, surface: pygame.Surface):
        """Renders the particle with transparency/shape effects."""
        if not self.alive or self.size <= 0.5:
            return

        alpha = 255
        if self.fade:
            alpha = int(255 * max(0.0, min(1.0, self.life / self.max_life)))

        draw_color = (*self.color[:3], alpha) if len(self.color) == 3 else self.color

        s = int(self.size)
        if s <= 0:
            return

        if self.shape == "rect":
            p_surf = pygame.Surface((s * 2, s * 2), pygame.SRCALPHA)
            p_surf.fill(draw_color)
            surface.blit(p_surf, (int(self.x - s), int(self.y - s)))

        elif self.shape == "circle":
            p_surf = pygame.Surface((s * 2, s * 2), pygame.SRCALPHA)
            pygame.draw.circle(p_surf, draw_color, (s, s), s)
            surface.blit(p_surf, (int(self.x - s), int(self.y - s)))

        elif self.shape == "spark":
            # Neon diamond / cross spark
            p_surf = pygame.Surface((s * 3, s * 3), pygame.SRCALPHA)
            cx, cy = s * 1.5, s * 1.5
            pygame.draw.line(p_surf, draw_color, (cx - s, cy), (cx + s, cy), max(1, s // 2))
            pygame.draw.line(p_surf, draw_color, (cx, cy - s), (cx, cy + s), max(1, s // 2))
            surface.blit(p_surf, (int(self.x - cx), int(self.y - cy)))

        elif self.shape == "ring":
            # Expanding shockwave ring
            radius = int(self.initial_size * (1.0 + (1.0 - self.life / self.max_life) * 2.5))
            if radius > 1:
                p_surf = pygame.Surface((radius * 2 + 4, radius * 2 + 4), pygame.SRCALPHA)
                pygame.draw.circle(p_surf, draw_color, (radius + 2, radius + 2), radius, max(1, int(self.size)))
                surface.blit(p_surf, (int(self.x - radius - 2), int(self.y - radius - 2)))


class FloatingText:
    """Animated floating score or status notification popup."""

    def __init__(self, text: str, x: float, y: float, color: tuple, size: int = 18, life: float = 1.0):
        self.text = text
        self.x = x
        self.y = y
        self.color = color
        self.life = life
        self.max_life = life
        self.alive = True
        self.size = size
        self.font = pygame.font.SysFont("Consolas, Courier, monospace", size, bold=True)

    def update(self, dt: float, world_speed: float = 0.0):
        self.y -= 35.0 * dt
        self.x -= world_speed * 0.4 * dt * 60.0
        self.life -= dt
        if self.life <= 0:
            self.alive = False

    def draw(self, surface: pygame.Surface):
        if not self.alive:
            return
        alpha = int(255 * max(0.0, min(1.0, self.life / self.max_life)))
        if alpha <= 0:
            return

        # Shadow text for readability
        shadow_surf = self.font.render(self.text, True, (0, 0, 0))
        shadow_surf.set_alpha(int(alpha * 0.8))
        surface.blit(shadow_surf, (int(self.x + 1), int(self.y + 1)))

        # Main glowing text
        text_surf = self.font.render(self.text, True, self.color[:3])
        text_surf.set_alpha(alpha)
        surface.blit(text_surf, (int(self.x), int(self.y)))


class ParticleManager:
    """High-level particle spawner and updater."""

    def __init__(self):
        self.particles = []
        self.floating_texts = []

    def clear(self):
        """Clears all active particles and texts."""
        self.particles.clear()
        self.floating_texts.clear()

    def add_floating_text(self, text: str, x: float, y: float, color: tuple = COLOR_NEON_GREEN, size: int = 18):
        self.floating_texts.append(FloatingText(text, x, y, color, size))

    def emit_run_sparks(self, x: float, y: float):
        """Sparks emitted at player's feet while running."""
        for _ in range(random.randint(1, 2)):
            vx = -random.uniform(2.0, 5.0)
            vy = -random.uniform(0.5, 2.5)
            color = random.choice([COLOR_NEON_GREEN, COLOR_NEON_CYAN, (200, 255, 220)])
            size = random.uniform(1.5, 3.0)
            life = random.uniform(0.15, 0.3)
            self.particles.append(Particle(x, y, vx, vy, color, size, life, shape="rect", gravity=0.25))

    def emit_jump_burst(self, x: float, y: float):
        """Downward jet thruster burst when jumping."""
        # Shockwave ring
        self.particles.append(Particle(x, y, 0, 0, COLOR_NEON_CYAN, 8.0, 0.25, shape="ring", fade=True, shrink=False))
        # Downward fire/plasma sparks
        for _ in range(12):
            vx = random.uniform(-3.0, 1.0)
            vy = random.uniform(2.5, 6.0)
            color = random.choice([COLOR_NEON_CYAN, COLOR_NEON_GREEN, COLOR_WHITE])
            size = random.uniform(2.0, 4.0)
            life = random.uniform(0.2, 0.4)
            self.particles.append(Particle(x + random.uniform(-8, 8), y, vx, vy, color, size, life, shape="spark", gravity=0.15))

    def emit_duck_sparks(self, x: float, y: float):
        """Friction sparks along the ground when sliding/ducking."""
        for _ in range(random.randint(2, 4)):
            vx = -random.uniform(3.5, 8.0)
            vy = -random.uniform(0.8, 3.2)
            color = random.choice([COLOR_NEON_AMBER, COLOR_NEON_PINK, COLOR_WHITE])
            size = random.uniform(1.8, 3.5)
            life = random.uniform(0.18, 0.35)
            self.particles.append(Particle(x, y, vx, vy, color, size, life, shape="rect", gravity=0.4))

    def emit_collect_sparkles(self, x: float, y: float, color: tuple = COLOR_NEON_CYAN):
        """Radial glitter burst when picking up a data packet."""
        self.particles.append(Particle(x, y, 0, 0, color, 12.0, 0.3, shape="ring", fade=True, shrink=False))
        for _ in range(16):
            angle = random.uniform(0, math.tau)
            speed = random.uniform(2.0, 6.0)
            vx = math.cos(angle) * speed
            vy = math.sin(angle) * speed
            size = random.uniform(2.0, 4.0)
            life = random.uniform(0.3, 0.6)
            c = random.choice([color, COLOR_WHITE, (240, 255, 255)])
            self.particles.append(Particle(x, y, vx, vy, c, size, life, shape="spark", drag=0.92))

    def emit_powerup_flash(self, x: float, y: float, color: tuple):
        """Large radiant shockwave when picking up a power-up."""
        self.particles.append(Particle(x, y, 0, 0, color, 20.0, 0.45, shape="ring", fade=True, shrink=False))
        for _ in range(24):
            angle = random.uniform(0, math.tau)
            speed = random.uniform(3.0, 8.5)
            vx = math.cos(angle) * speed
            vy = math.sin(angle) * speed
            size = random.uniform(3.0, 6.0)
            life = random.uniform(0.4, 0.75)
            self.particles.append(Particle(x, y, vx, vy, color, size, life, shape="spark", drag=0.94))

    def emit_shield_break(self, x: float, y: float):
        """Hexagonal electric shatter when shield is broken."""
        self.particles.append(Particle(x, y, 0, 0, COLOR_NEON_CYAN, 24.0, 0.35, shape="ring", fade=True, shrink=False))
        for _ in range(28):
            angle = random.uniform(0, math.tau)
            speed = random.uniform(3.0, 9.0)
            vx = math.cos(angle) * speed
            vy = math.sin(angle) * speed
            size = random.uniform(2.5, 5.0)
            life = random.uniform(0.35, 0.7)
            c = random.choice([COLOR_NEON_CYAN, COLOR_NEON_PURPLE, COLOR_WHITE])
            self.particles.append(Particle(x, y, vx, vy, c, size, life, shape="rect", gravity=0.1, drag=0.95))

    def emit_player_crash(self, x: float, y: float):
        """Digital deconstruction voxel explosion when game over occurs."""
        self.particles.append(Particle(x, y, 0, 0, COLOR_NEON_RED, 30.0, 0.5, shape="ring", fade=True, shrink=False))
        for _ in range(45):
            angle = random.uniform(0, math.tau)
            speed = random.uniform(2.0, 11.0)
            vx = math.cos(angle) * speed
            vy = math.sin(angle) * speed - 2.0
            size = random.uniform(3.0, 7.0)
            life = random.uniform(0.6, 1.2)
            c = random.choice([COLOR_NEON_GREEN, COLOR_NEON_RED, COLOR_NEON_AMBER, COLOR_WHITE])
            self.particles.append(Particle(x, y, vx, vy, c, size, life, shape="rect", gravity=0.35, drag=0.96))

    def update(self, dt: float, world_speed: float = 0.0):
        """Updates all particles and removes dead ones."""
        for p in self.particles:
            p.update(dt, world_speed)
        self.particles = [p for p in self.particles if p.alive]

        for ft in self.floating_texts:
            ft.update(dt, world_speed)
        self.floating_texts = [ft for ft in self.floating_texts if ft.alive]

    def draw(self, surface: pygame.Surface):
        """Renders all active particles and texts."""
        for p in self.particles:
            p.draw(surface)
        for ft in self.floating_texts:
            ft.draw(surface)
