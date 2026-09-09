"""
Obstacle Entities and Spawner System for Terminal Runner
Features 5 distinct obstacle types (Ground Spikes, Security Drones, Data Pylons,
Laser Barriers, and Glitch Nodes) with procedural cyberpunk graphics.
"""

import math
import random
import pygame
from game.config import (
    SCREEN_WIDTH, GROUND_Y, COLOR_NEON_RED, COLOR_NEON_AMBER,
    COLOR_NEON_PINK, COLOR_NEON_CYAN, COLOR_NEON_PURPLE, COLOR_NEON_GREEN,
    COLOR_WHITE, COLOR_SURFACE, COLOR_BG
)


class BaseObstacle:
    """Base class for all obstacles."""

    def __init__(self, x: float, y: float, width: int, height: int, obs_type: str):
        self.x = float(x)
        self.y = float(y)
        self.width = width
        self.height = height
        self.obs_type = obs_type
        self.rect = pygame.Rect(int(self.x), int(self.y), width, height)
        self.passed = False
        self.anim_timer = 0.0

    def update(self, dt: float, world_speed: float):
        """Moves obstacle to the left based on world speed."""
        self.x -= world_speed * dt * 60.0
        self.anim_timer += dt
        self._update_rect()

    def _update_rect(self):
        self.rect.x = int(self.x)
        self.rect.y = int(self.y)

    def draw(self, surface: pygame.Surface):
        raise NotImplementedError


class FirewallSpikes(BaseObstacle):
    """Ground-based neon laser spikes (Single, Double, or Triple cluster)."""

    def __init__(self, x: float, cluster_size: int = 1):
        self.cluster_size = cluster_size
        width = 24 * cluster_size
        height = random.choice([36, 42])
        y = GROUND_Y - height
        super().__init__(x, y, width, height, "spikes")
        # Fair collision rect margin
        self.hitbox_margin_x = 3
        self.hitbox_margin_y = 2

    def _update_rect(self):
        self.rect = pygame.Rect(
            int(self.x + self.hitbox_margin_x),
            int(self.y + self.hitbox_margin_y),
            self.width - (self.hitbox_margin_x * 2),
            self.height - self.hitbox_margin_y
        )

    def draw(self, surface: pygame.Surface):
        surf = pygame.Surface((self.width + 4, self.height + 4), pygame.SRCALPHA)
        spike_w = 24

        for i in range(self.cluster_size):
            sx = i * spike_w
            # Spike triangle points
            top_pt = (sx + 12, 2)
            left_pt = (sx + 2, self.height)
            right_pt = (sx + 22, self.height)

            # Animated glowing pulse
            glow_intensity = int(180 + 75 * math.sin(self.anim_timer * 8 + i))
            color_core = (255, glow_intensity, 0)

            # Dark inner backing
            pygame.draw.polygon(surf, COLOR_SURFACE, [top_pt, left_pt, right_pt])
            # Outer neon frame
            pygame.draw.polygon(surf, COLOR_NEON_AMBER, [top_pt, left_pt, right_pt], width=2)
            # Center energy beam
            pygame.draw.line(surf, color_core, (sx + 12, self.height - 2), (sx + 12, 8), 2)
            # Tip glow
            pygame.draw.circle(surf, COLOR_WHITE, (sx + 12, 4), 2)

        surface.blit(surf, (int(self.x), int(self.y)))


class SecurityDrone(BaseObstacle):
    """Air-based patrol drone with scanner cone and hovering dynamics."""

    def __init__(self, x: float, altitude_type: str = "mid"):
        # Altitude types: "low" (must duck or precise jump), "high" (can run/duck under, jump will hit)
        self.altitude_type = altitude_type
        width = 44
        height = 30

        if altitude_type == "low":
            base_y = GROUND_Y - 58  # Head height (Must duck!)
        else:
            base_y = GROUND_Y - 96  # High jump zone

        super().__init__(x, base_y, width, height, "drone")
        self.base_y = base_y
        self.hover_offset = 0.0

    def update(self, dt: float, world_speed: float):
        super().update(dt, world_speed)
        # Gentle floating hover motion
        self.hover_offset = math.sin(self.anim_timer * 6.0) * 4.0
        self.y = self.base_y + self.hover_offset
        self._update_rect()

    def _update_rect(self):
        margin = 4
        self.rect = pygame.Rect(
            int(self.x + margin),
            int(self.y + margin),
            self.width - (margin * 2),
            self.height - (margin * 2)
        )

    def draw(self, surface: pygame.Surface):
        surf = pygame.Surface((self.width + 10, self.height + 30), pygame.SRCALPHA)
        center_x = self.width // 2 + 5
        center_y = 15

        # Downward scanning cone
        scanner_alpha = int(40 + 25 * math.sin(self.anim_timer * 10))
        scan_pts = [(center_x, center_y + 8),
                    (center_x - 18, self.height + 25),
                    (center_x + 18, self.height + 25)]
        pygame.draw.polygon(surf, (*COLOR_NEON_RED, scanner_alpha), scan_pts)

        # Drone Main Body
        drone_rect = pygame.Rect(center_x - 16, center_y - 8, 32, 16)
        pygame.draw.rect(surf, COLOR_SURFACE, drone_rect, border_radius=4)
        pygame.draw.rect(surf, COLOR_NEON_PINK, drone_rect, width=2, border_radius=4)

        # Glowing Red Sensor Eye
        eye_color = COLOR_WHITE if int(self.anim_timer * 8) % 2 == 0 else COLOR_NEON_RED
        pygame.draw.circle(surf, eye_color, (center_x, center_y), 4)

        # Micro thrusters on sides
        rotor_phase = self.anim_timer * 20.0
        rotor_w = max(2, int(abs(math.sin(rotor_phase)) * 10))
        # Left rotor
        pygame.draw.line(surf, COLOR_NEON_CYAN, (center_x - 20 - rotor_w, center_y - 6),
                         (center_x - 20 + rotor_w, center_y - 6), 2)
        # Right rotor
        pygame.draw.line(surf, COLOR_NEON_CYAN, (center_x + 20 - rotor_w, center_y - 6),
                         (center_x + 20 + rotor_w, center_y - 6), 2)

        surface.blit(surf, (int(self.x - 5), int(self.y)))


class DataPylon(BaseObstacle):
    """Tall vertical server rack barrier with sparking high-voltage nodes."""

    def __init__(self, x: float):
        width = 30
        height = 62
        y = GROUND_Y - height
        super().__init__(x, y, width, height, "pylon")

    def _update_rect(self):
        margin_x = 3
        margin_y = 2
        self.rect = pygame.Rect(
            int(self.x + margin_x),
            int(self.y + margin_y),
            self.width - (margin_x * 2),
            self.height - margin_y
        )

    def draw(self, surface: pygame.Surface):
        surf = pygame.Surface((self.width + 4, self.height + 4), pygame.SRCALPHA)
        # Pillar structure
        pylon_rect = pygame.Rect(2, 2, self.width, self.height)
        pygame.draw.rect(surf, COLOR_SURFACE, pylon_rect, border_radius=2)
        pygame.draw.rect(surf, COLOR_NEON_PURPLE, pylon_rect, width=2, border_radius=2)

        # Server drive slots with blinking LEDs
        for slot in range(4):
            slot_y = 8 + slot * 12
            pygame.draw.line(surf, (45, 55, 72), (6, slot_y), (self.width - 2, slot_y), 2)
            led_color = COLOR_NEON_GREEN if (int(self.anim_timer * 6) + slot) % 3 == 0 else COLOR_NEON_CYAN
            pygame.draw.rect(surf, led_color, (self.width - 6, slot_y - 1, 3, 3))

        # Top sparking electrode
        pygame.draw.circle(surf, COLOR_WHITE, (self.width // 2 + 2, 4), 3)
        if int(self.anim_timer * 12) % 2 == 0:
            pygame.draw.line(surf, COLOR_NEON_CYAN, (self.width // 2 - 4, 2), (self.width // 2 + 8, 2), 1)

        surface.blit(surf, (int(self.x), int(self.y)))


class LaserBarrier(BaseObstacle):
    """Overhead electric laser beam (Forces the player to duck/slide)."""

    def __init__(self, x: float):
        width = 70
        height = 36
        y = GROUND_Y - 60  # Suspended overhead
        super().__init__(x, y, width, height, "laser")

    def _update_rect(self):
        # Precise collision zone
        margin_x = 2
        margin_y = 4
        self.rect = pygame.Rect(
            int(self.x + margin_x),
            int(self.y + margin_y),
            self.width - (margin_x * 2),
            self.height - (margin_y * 2)
        )

    def draw(self, surface: pygame.Surface):
        surf = pygame.Surface((self.width + 6, self.height + 10), pygame.SRCALPHA)

        # Left & right emitter nodes
        pygame.draw.rect(surf, COLOR_SURFACE, (2, 4, 10, 24), border_radius=2)
        pygame.draw.rect(surf, COLOR_NEON_RED, (2, 4, 10, 24), width=1, border_radius=2)

        pygame.draw.rect(surf, COLOR_SURFACE, (self.width - 8, 4, 10, 24), border_radius=2)
        pygame.draw.rect(surf, COLOR_NEON_RED, (self.width - 8, 4, 10, 24), width=1, border_radius=2)

        # Glowing Laser Beams
        beam_y1 = 12
        beam_y2 = 20
        # Laser core
        pygame.draw.line(surf, COLOR_NEON_RED, (12, beam_y1), (self.width - 8, beam_y1), 4)
        pygame.draw.line(surf, COLOR_WHITE, (12, beam_y1), (self.width - 8, beam_y1), 1)

        pygame.draw.line(surf, COLOR_NEON_RED, (12, beam_y2), (self.width - 8, beam_y2), 4)
        pygame.draw.line(surf, COLOR_WHITE, (12, beam_y2), (self.width - 8, beam_y2), 1)

        # Electricity crackle between beams
        if int(self.anim_timer * 15) % 2 == 0:
            mid_x = random.randint(16, self.width - 16)
            pygame.draw.line(surf, COLOR_NEON_CYAN, (mid_x, beam_y1), (mid_x + random.randint(-4, 4), beam_y2), 2)

        surface.blit(surf, (int(self.x), int(self.y)))


class GlitchNode(BaseObstacle):
    """Digital glitch block with animated shifting wireframe geometry."""

    def __init__(self, x: float):
        width = 36
        height = 36
        y = GROUND_Y - height
        super().__init__(x, y, width, height, "glitch")

    def _update_rect(self):
        self.rect = pygame.Rect(int(self.x + 3), int(self.y + 3), self.width - 6, self.height - 6)

    def draw(self, surface: pygame.Surface):
        surf = pygame.Surface((self.width + 4, self.height + 4), pygame.SRCALPHA)
        # Shifting glitch coordinates
        offset_x = random.choice([-2, 0, 2]) if random.random() < 0.25 else 0
        offset_y = random.choice([-1, 0, 1]) if random.random() < 0.25 else 0

        rect = pygame.Rect(2 + offset_x, 2 + offset_y, self.width, self.height)
        pygame.draw.rect(surf, (20, 10, 30), rect)
        pygame.draw.rect(surf, COLOR_NEON_PINK, rect, width=2)
        # Inner cybernetic cross
        pygame.draw.line(surf, COLOR_NEON_CYAN, (rect.left, rect.centery), (rect.right, rect.centery), 1)
        pygame.draw.line(surf, COLOR_NEON_CYAN, (rect.centerx, rect.top), (rect.centerx, rect.bottom), 1)

        surface.blit(surf, (int(self.x), int(self.y)))


class ObstacleSpawner:
    """Manages adaptive obstacle generation, spacing, and progression."""

    def __init__(self):
        self.obstacles = []
        self.spawn_distance_tracker = 0.0
        self.next_spawn_distance = 450.0

    def clear(self):
        self.obstacles.clear()
        self.spawn_distance_tracker = 0.0
        self.next_spawn_distance = 450.0

    def update(self, dt: float, world_speed: float, total_distance: float):
        """Updates obstacles and spawns new ones dynamically."""
        # Update existing obstacles
        for obs in self.obstacles:
            obs.update(dt, world_speed)

        # Remove off-screen obstacles
        self.obstacles = [obs for obs in self.obstacles if obs.x + obs.width > -50]

        # Calculate spawn timing
        self.spawn_distance_tracker += world_speed * dt * 60.0

        if self.spawn_distance_tracker >= self.next_spawn_distance:
            self._spawn_obstacle(total_distance, world_speed)
            self.spawn_distance_tracker = 0.0
            # Adapt next spawn distance based on current speed
            # Minimum distance scales up as speed increases so reaction time remains fair
            min_dist = max(300, int(220 + world_speed * 18))
            max_dist = min_dist + random.randint(120, 280)
            self.next_spawn_distance = random.uniform(min_dist, max_dist)

    def _spawn_obstacle(self, total_distance: float, world_speed: float):
        """Intelligently picks next obstacle type based on difficulty progression."""
        spawn_x = SCREEN_WIDTH + 40

        # Progressive unlock thresholds:
        # Distance < 800: Only single/double spikes and glitch nodes
        # Distance 800 - 2000: Introduce Security Drones (low/high)
        # Distance 2000 - 3500: Introduce Data Pylons & Laser Barriers
        # Distance > 3500: Full hazard suite with triple spikes

        available_types = ["spikes_1", "glitch"]

        if total_distance >= 600:
            available_types.extend(["spikes_2", "drone_high"])
        if total_distance >= 1500:
            available_types.extend(["drone_low", "pylon"])
        if total_distance >= 2800:
            available_types.extend(["laser", "spikes_3"])

        choice = random.choice(available_types)

        if choice == "spikes_1":
            obs = FirewallSpikes(spawn_x, cluster_size=1)
        elif choice == "spikes_2":
            obs = FirewallSpikes(spawn_x, cluster_size=2)
        elif choice == "spikes_3":
            obs = FirewallSpikes(spawn_x, cluster_size=3)
        elif choice == "drone_high":
            obs = SecurityDrone(spawn_x, altitude_type="high")
        elif choice == "drone_low":
            obs = SecurityDrone(spawn_x, altitude_type="low")
        elif choice == "pylon":
            obs = DataPylon(spawn_x)
        elif choice == "laser":
            obs = LaserBarrier(spawn_x)
        else:
            obs = GlitchNode(spawn_x)

        self.obstacles.append(obs)

    def check_collision(self, player_rect: pygame.Rect) -> BaseObstacle:
        """Returns the colliding obstacle if any."""
        for obs in self.obstacles:
            if obs.rect.colliderect(player_rect):
                return obs
        return None

    def draw(self, surface: pygame.Surface):
        """Draws all active obstacles."""
        for obs in self.obstacles:
            obs.draw(surface)
