"""
Power-Up System and Manager for Terminal Runner
Includes Shield, 2X Score Multiplier, and Slow-Motion Chrono-Freeze.
"""

import math
import random
import pygame
from game.config import (
    SCREEN_WIDTH, GROUND_Y, COLOR_NEON_CYAN, COLOR_NEON_AMBER,
    COLOR_NEON_PURPLE, COLOR_WHITE, COLOR_SURFACE,
    DURATION_DOUBLE_SCORE, DURATION_SLOW_MOTION, SLOW_MOTION_FACTOR
)


class PowerUpItem:
    """Floating collectible power-up capsule on the field."""

    def __init__(self, x: float, y: float, ptype: str):
        self.x = float(x)
        self.y = float(y)
        self.base_y = float(y)
        self.ptype = ptype  # "shield", "double_score", "slow_motion"
        self.size = 28
        self.rect = pygame.Rect(int(self.x), int(self.y), self.size, self.size)
        self.anim_timer = random.uniform(0.0, 5.0)
        self.collected = False

        if ptype == "shield":
            self.color = COLOR_NEON_CYAN
            self.label = "S"
        elif ptype == "double_score":
            self.color = COLOR_NEON_AMBER
            self.label = "2X"
        else:
            self.color = COLOR_NEON_PURPLE
            self.label = "SLOW"

    def update(self, dt: float, world_speed: float):
        self.x -= world_speed * dt * 60.0
        self.anim_timer += dt
        # Floating hover bob
        self.y = self.base_y + math.sin(self.anim_timer * 4.5) * 5.0
        self.rect.x = int(self.x)
        self.rect.y = int(self.y)

    def draw(self, surface: pygame.Surface):
        surf = pygame.Surface((self.size + 16, self.size + 16), pygame.SRCALPHA)
        cx, cy = self.size // 2 + 8, self.size // 2 + 8

        # Pulsing outer ring
        pulse = 0.5 + 0.5 * math.sin(self.anim_timer * 6.0)
        glow_r = int(self.size // 2 + 4 + pulse * 3)
        pygame.draw.circle(surf, (*self.color[:3], int(40 + pulse * 35)), (cx, cy), glow_r)

        # Hexagonal / Rounded Box Container
        box_r = pygame.Rect(cx - self.size // 2, cy - self.size // 2, self.size, self.size)
        pygame.draw.rect(surf, COLOR_SURFACE, box_r, border_radius=6)
        pygame.draw.rect(surf, self.color, box_r, width=2, border_radius=6)

        # Rotating corner brackets
        angle = self.anim_timer * 2.5
        for i in range(4):
            rad = angle + i * (math.pi / 2)
            bx = cx + int((self.size // 2 + 2) * math.cos(rad))
            by = cy + int((self.size // 2 + 2) * math.sin(rad))
            pygame.draw.circle(surf, COLOR_WHITE, (bx, by), 2)

        # Icon symbol
        font = pygame.font.SysFont("Consolas, Courier, monospace", 13 if len(self.label) <= 2 else 10, bold=True)
        text_surf = font.render(self.label, True, self.color)
        t_rect = text_surf.get_rect(center=(cx, cy))
        surf.blit(text_surf, t_rect)

        surface.blit(surf, (int(self.x - 8), int(self.y - 8)))


class PowerUpManager:
    """Manages spawning, active power-up durations, and status effects."""

    def __init__(self):
        self.items = []
        self.spawn_distance_tracker = 0.0
        self.next_spawn_distance = 650.0

        # Active power-up timers
        self.double_score_timer = 0.0
        self.slow_motion_timer = 0.0

    def reset(self):
        self.items.clear()
        self.spawn_distance_tracker = 0.0
        self.next_spawn_distance = 650.0
        self.double_score_timer = 0.0
        self.slow_motion_timer = 0.0

    @property
    def is_double_score(self) -> bool:
        return self.double_score_timer > 0.0

    @property
    def is_slow_motion(self) -> bool:
        return self.slow_motion_timer > 0.0

    @property
    def speed_multiplier(self) -> float:
        return SLOW_MOTION_FACTOR if self.is_slow_motion else 1.0

    @property
    def score_multiplier(self) -> int:
        return 2 if self.is_double_score else 1

    def update(self, dt: float, world_speed: float, player, total_distance: float):
        """Updates active timers and spawns new power-ups."""
        # Countdown active timers
        if self.double_score_timer > 0:
            self.double_score_timer -= dt
        if self.slow_motion_timer > 0:
            self.slow_motion_timer -= dt

        # Update items on field
        for item in self.items:
            item.update(dt, world_speed)
        self.items = [item for item in self.items if item.x + item.size > -40 and not item.collected]

        # Spawning logic
        self.spawn_distance_tracker += world_speed * dt * 60.0
        if self.spawn_distance_tracker >= self.next_spawn_distance:
            self._spawn_powerup(player, total_distance)
            self.spawn_distance_tracker = 0.0
            self.next_spawn_distance = random.uniform(850.0, 1450.0)

    def _spawn_powerup(self, player, total_distance: float):
        """Generates a random power-up based on current needs."""
        spawn_x = SCREEN_WIDTH + 60
        spawn_y = GROUND_Y - random.choice([45, 80])

        candidates = ["double_score", "slow_motion"]
        # Only spawn shield if player does not already have a shield
        if not player.has_shield:
            candidates.append("shield")

        ptype = random.choice(candidates)
        self.items.append(PowerUpItem(spawn_x, spawn_y, ptype))

    def check_collection(self, player, particle_manager=None, audio_manager=None):
        """Checks if player collected any active power-up capsules."""
        for item in self.items:
            if not item.collected and item.rect.colliderect(player.rect):
                item.collected = True
                self._activate_powerup(item.ptype, player, particle_manager, audio_manager, item.x, item.y)

    def _activate_powerup(self, ptype: str, player, particle_manager, audio_manager, x: float, y: float):
        """Applies powerup effect."""
        if audio_manager:
            audio_manager.play("powerup")

        if ptype == "shield":
            player.has_shield = True
            if particle_manager:
                particle_manager.emit_powerup_flash(x, y, COLOR_NEON_CYAN)
                particle_manager.add_floating_text("SHIELD ACTIVATED!", x, y - 20, COLOR_NEON_CYAN, 18)

        elif ptype == "double_score":
            self.double_score_timer = DURATION_DOUBLE_SCORE
            if particle_manager:
                particle_manager.emit_powerup_flash(x, y, COLOR_NEON_AMBER)
                particle_manager.add_floating_text("2X SCORE MULTIPLIER!", x, y - 20, COLOR_NEON_AMBER, 18)

        elif ptype == "slow_motion":
            self.slow_motion_timer = DURATION_SLOW_MOTION
            if particle_manager:
                particle_manager.emit_powerup_flash(x, y, COLOR_NEON_PURPLE)
                particle_manager.add_floating_text("CHRONO SLOW-MO!", x, y - 20, COLOR_NEON_PURPLE, 18)

    def draw(self, surface: pygame.Surface):
        """Draws all active power-up items on the field."""
        for item in self.items:
            item.draw(surface)
