"""
Collectible System and Patterns for Terminal Runner
Includes Data Bits, Bytes, and Quantum Crypto Blocks with multiple spawn patterns.
"""

import math
import random
import pygame
from game.config import (
    SCREEN_WIDTH, GROUND_Y, COLOR_NEON_AMBER, COLOR_NEON_CYAN,
    COLOR_NEON_GREEN, COLOR_WHITE, POINTS_DATA_BIT, POINTS_DATA_BYTE,
    POINTS_CRYPTO_BLOCK
)


class Collectible:
    """Individual collectible data item."""

    def __init__(self, x: float, y: float, tier: str = "bit"):
        self.x = float(x)
        self.y = float(y)
        self.base_y = float(y)
        self.tier = tier  # "bit" (50), "byte" (100), "crypto" (250)
        self.size = 18 if tier != "crypto" else 22
        self.width = self.size
        self.height = self.size
        self.rect = pygame.Rect(int(self.x), int(self.y), self.size, self.size)
        self.anim_timer = random.uniform(0.0, 5.0)
        self.collected = False

        if tier == "bit":
            self.color = COLOR_NEON_AMBER
            self.points = POINTS_DATA_BIT
        elif tier == "byte":
            self.color = COLOR_NEON_CYAN
            self.points = POINTS_DATA_BYTE
        else:
            self.color = (255, 215, 0)  # Gold
            self.points = POINTS_CRYPTO_BLOCK

    def update(self, dt: float, world_speed: float):
        """Moves item and animates hovering bob."""
        self.x -= world_speed * dt * 60.0
        self.anim_timer += dt
        # Smooth bobbing up and down
        self.y = self.base_y + math.sin(self.anim_timer * 5.0) * 3.5
        self.rect.x = int(self.x)
        self.rect.y = int(self.y)

    def draw(self, surface: pygame.Surface):
        """Draws the glowing animated data packet."""
        surf = pygame.Surface((self.size + 12, self.size + 12), pygame.SRCALPHA)
        cx, cy = self.size // 2 + 6, self.size // 2 + 6

        # Pulsing outer aura
        pulse = 0.5 + 0.5 * math.sin(self.anim_timer * 8.0)
        aura_r = int(self.size // 2 + 3 + pulse * 2)
        pygame.draw.circle(surf, (*self.color[:3], int(35 + pulse * 25)), (cx, cy), aura_r)

        # Rotating wireframe diamond / cube
        angle = self.anim_timer * 3.0
        r = self.size // 2 - 2
        pts = [
            (cx + int(r * math.cos(angle)), cy + int(r * math.sin(angle))),
            (cx + int(r * math.cos(angle + math.pi / 2)), cy + int(r * math.sin(angle + math.pi / 2))),
            (cx + int(r * math.cos(angle + math.pi)), cy + int(r * math.sin(angle + math.pi))),
            (cx + int(r * math.cos(angle + 3 * math.pi / 2)), cy + int(r * math.sin(angle + 3 * math.pi / 2)))
        ]

        # Inner diamond
        pygame.draw.polygon(surf, (15, 20, 28), pts)
        pygame.draw.polygon(surf, self.color, pts, width=2)

        # Glowing central core
        pygame.draw.circle(surf, COLOR_WHITE, (cx, cy), 3)

        surface.blit(surf, (int(self.x - 6), int(self.y - 6)))


class CollectibleSpawner:
    """Spawns structured formations of collectibles."""

    def __init__(self):
        self.collectibles = []
        self.distance_tracker = 0.0
        self.next_spawn_distance = 280.0

    def clear(self):
        self.collectibles.clear()
        self.distance_tracker = 0.0
        self.next_spawn_distance = 280.0

    def update(self, dt: float, world_speed: float, total_distance: float):
        """Updates and spawns collectibles."""
        for item in self.collectibles:
            item.update(dt, world_speed)

        # Remove off-screen or collected items
        self.collectibles = [item for item in self.collectibles if item.x + item.size > -30 and not item.collected]

        self.distance_tracker += world_speed * dt * 60.0
        if self.distance_tracker >= self.next_spawn_distance:
            self._spawn_pattern(total_distance)
            self.distance_tracker = 0.0
            self.next_spawn_distance = random.uniform(320.0, 560.0)

    def _spawn_pattern(self, total_distance: float):
        """Spawns one of several geometric collectible patterns."""
        spawn_x = SCREEN_WIDTH + 50
        pattern = random.choice(["line_low", "line_high", "arc", "duck_line", "solo_gold"])

        if pattern == "line_low":
            # 3 items at ground running level
            for i in range(3):
                self.collectibles.append(Collectible(spawn_x + i * 36, GROUND_Y - 34, "bit"))

        elif pattern == "line_high":
            # 3 items in mid-air jump zone
            for i in range(3):
                self.collectibles.append(Collectible(spawn_x + i * 36, GROUND_Y - 95, "byte"))

        elif pattern == "arc":
            # 5 items forming a parabolic jump trajectory
            for i in range(5):
                progress = i / 4.0  # 0 to 1
                arc_y = GROUND_Y - 35 - math.sin(progress * math.pi) * 80
                tier = "byte" if i == 2 else "bit"
                self.collectibles.append(Collectible(spawn_x + i * 32, arc_y, tier))

        elif pattern == "duck_line":
            # 3 low items suitable for slide collection
            for i in range(3):
                self.collectibles.append(Collectible(spawn_x + i * 34, GROUND_Y - 20, "bit"))

        elif pattern == "solo_gold" and total_distance > 800:
            # 1 rare Quantum Gold block high in the air
            self.collectibles.append(Collectible(spawn_x, GROUND_Y - 80, "crypto"))

    def check_collection(self, player_rect: pygame.Rect, score_multiplier: int = 1,
                         particle_manager=None, audio_manager=None) -> int:
        """
        Checks for player intersection with collectibles.
        Returns total bonus points collected in this frame.
        """
        earned_points = 0
        for item in self.collectibles:
            if not item.collected and item.rect.colliderect(player_rect):
                item.collected = True
                pts = item.points * score_multiplier
                earned_points += pts

                # Trigger FX
                if particle_manager:
                    particle_manager.emit_collect_sparkles(item.x + item.size // 2, item.y + item.size // 2, item.color)
                    text_color = item.color if score_multiplier == 1 else (255, 230, 80)
                    sign = f"+{pts}"
                    if score_multiplier > 1:
                        sign += " (2X)"
                    particle_manager.add_floating_text(sign, item.x, item.y - 12, text_color, 16)

                if audio_manager:
                    audio_manager.play("collect")

        return earned_points

    def draw(self, surface: pygame.Surface):
        """Draws all active collectibles."""
        for item in self.collectibles:
            item.draw(surface)
