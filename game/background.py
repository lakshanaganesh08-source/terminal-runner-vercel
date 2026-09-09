"""
Parallax Environment and Cyberpunk Terminal Background Renderer
Features multi-layer parallax scrolling, server skylines, matrix data streams,
perspective grid floor, and dynamic color theme cycles.
"""

import math
import random
import pygame
from game.config import (
    SCREEN_WIDTH, SCREEN_HEIGHT, GROUND_Y, COLOR_BG,
    COLOR_BG_ALT, COLOR_SURFACE, COLOR_GRID, COLOR_NEON_GREEN,
    COLOR_NEON_CYAN, COLOR_NEON_PINK, COLOR_NEON_AMBER, COLOR_WHITE, COLOR_DIM
)


class Background:
    """Manages multi-layer side-scrolling cyberpunk terminal environment."""

    def __init__(self):
        self.scroll_sky = 0.0
        self.scroll_city = 0.0
        self.scroll_data = 0.0
        self.scroll_ground = 0.0
        self.theme_timer = 0.0

        # Pre-generate star bits
        self.stars = [
            {
                "x": random.randint(0, SCREEN_WIDTH),
                "y": random.randint(10, GROUND_Y - 100),
                "size": random.choice([1, 2, 2]),
                "twinkle_speed": random.uniform(2.0, 6.0),
                "twinkle_offset": random.uniform(0, math.tau)
            }
            for _ in range(55)
        ]

        # Pre-generate server city skyline buildings
        self.city_buildings = []
        cx = 0
        while cx < SCREEN_WIDTH + 300:
            bw = random.randint(45, 95)
            bh = random.randint(80, 190)
            self.city_buildings.append({
                "x": cx,
                "w": bw,
                "h": bh,
                "has_tower": random.random() < 0.35,
                "window_pattern": random.randint(0, 3)
            })
            cx += bw + random.randint(4, 18)
        self.city_width = cx

        # Floating Linux/terminal data strings
        self.code_snippets = [
            "01011001", "root@runner:~#", "sudo sysctl -p", "0xDEADBEEF",
            "chmod +x run.sh", "SIGKILL(9)", "200_OK", "404_NOT_FOUND",
            "malloc(0x400)", "gcc -O3 runner.c", "kernel::panic", "grep -rn 'speed'"
        ]
        self.data_streamers = [
            {
                "text": random.choice(self.code_snippets),
                "x": random.randint(0, SCREEN_WIDTH),
                "y": random.randint(40, GROUND_Y - 90),
                "speed_mod": random.uniform(0.3, 0.6),
                "alpha": random.randint(70, 160)
            }
            for _ in range(12)
        ]

        self.font_terminal = pygame.font.SysFont("Consolas, Courier, monospace", 11)

    def reset(self):
        self.scroll_sky = 0.0
        self.scroll_city = 0.0
        self.scroll_data = 0.0
        self.scroll_ground = 0.0
        self.theme_timer = 0.0

    def update(self, dt: float, world_speed: float, total_distance: float):
        """Updates parallax scroll offsets."""
        self.theme_timer += dt
        self.scroll_sky = (self.scroll_sky + world_speed * 0.05 * dt * 60.0) % SCREEN_WIDTH
        self.scroll_city = (self.scroll_city + world_speed * 0.18 * dt * 60.0) % self.city_width
        self.scroll_ground = (self.scroll_ground + world_speed * dt * 60.0) % 40.0

        # Update floating data streamers
        for stream in self.data_streamers:
            stream["x"] -= world_speed * stream["speed_mod"] * dt * 60.0
            if stream["x"] < -150:
                stream["x"] = SCREEN_WIDTH + random.randint(20, 150)
                stream["y"] = random.randint(40, GROUND_Y - 90)
                stream["text"] = random.choice(self.code_snippets)

    def get_current_theme_color(self, total_distance: float) -> tuple:
        """Returns the primary accent color based on progression cycle."""
        # Cycle through themes every 1200 distance units
        cycle = (total_distance / 1200.0) % 4.0
        if cycle < 1.0:
            return COLOR_NEON_GREEN  # Phosphor Matrix
        elif cycle < 2.0:
            return COLOR_NEON_CYAN   # Synthwave Cyan
        elif cycle < 3.0:
            return COLOR_NEON_AMBER  # Solar Amber
        else:
            return COLOR_NEON_PINK   # Cyber Magenta

    def draw(self, surface: pygame.Surface, total_distance: float):
        """Draws all layered background components."""
        accent_color = self.get_current_theme_color(total_distance)

        # 1. Gradient Sky
        self._draw_sky(surface, accent_color)

        # 2. Distant Server Skyline (Parallax Layer 1)
        self._draw_city_skyline(surface, accent_color)

        # 3. Floating Terminal Data Streams (Parallax Layer 2)
        self._draw_data_streamers(surface, accent_color)

        # 4. Cyber Grid Floor & Baseline (Parallax Layer 3)
        self._draw_ground_grid(surface, accent_color)

    def _draw_sky(self, surface: pygame.Surface, accent_color: tuple):
        """Draws dark sky with glowing cyber moon and stars."""
        surface.fill(COLOR_BG)

        # Subtle vertical gradient
        grad_surf = pygame.Surface((SCREEN_WIDTH, GROUND_Y), pygame.SRCALPHA)
        pygame.draw.rect(grad_surf, (*COLOR_BG_ALT, 120), (0, 0, SCREEN_WIDTH, GROUND_Y))
        surface.blit(grad_surf, (0, 0))

        # Giant Cyber Moon / Mainframe Sphere
        moon_cx, moon_cy = SCREEN_WIDTH - 140, 95
        moon_r = 42

        # Outer moon glow
        moon_surf = pygame.Surface((moon_r * 4, moon_r * 4), pygame.SRCALPHA)
        pygame.draw.circle(moon_surf, (*accent_color[:3], 18), (moon_r * 2, moon_r * 2), moon_r + 14)
        pygame.draw.circle(moon_surf, (20, 26, 36), (moon_r * 2, moon_r * 2), moon_r)
        pygame.draw.circle(moon_surf, (*accent_color[:3], 160), (moon_r * 2, moon_r * 2), moon_r, 2)

        # Horizontal scanlines across the cyber-moon
        for my in range(moon_r * 2 - moon_r + 4, moon_r * 2 + moon_r - 4, 6):
            pygame.draw.line(moon_surf, (*accent_color[:3], 70), (moon_r * 2 - moon_r + 8, my), (moon_r * 2 + moon_r - 8, my), 1)

        surface.blit(moon_surf, (moon_cx - moon_r * 2, moon_cy - moon_r * 2))

        # Star Bits
        for star in self.stars:
            twinkle = 0.5 + 0.5 * math.sin(self.theme_timer * star["twinkle_speed"] + star["twinkle_offset"])
            alpha = int(90 + twinkle * 150)
            star_x = int((star["x"] - self.scroll_sky) % SCREEN_WIDTH)
            pygame.draw.circle(surface, (*COLOR_WHITE[:3], alpha), (star_x, star["y"]), star["size"])

    def _draw_city_skyline(self, surface: pygame.Surface, accent_color: tuple):
        """Draws silhouette of mainframe city with blinking LEDs."""
        for b in self.city_buildings:
            bx = b["x"] - self.scroll_city
            # Wrap around screen
            while bx < -b["w"]:
                bx += self.city_width
            while bx > SCREEN_WIDTH + b["w"]:
                bx -= self.city_width

            by = GROUND_Y - b["h"]
            # Building body
            pygame.draw.rect(surface, (18, 22, 30), (bx, by, b["w"], b["h"]))
            pygame.draw.rect(surface, (30, 38, 50), (bx, by, b["w"], b["h"],), 1)

            # Windows / Server LEDs
            cols = max(1, b["w"] // 14)
            rows = max(1, b["h"] // 18)
            for r in range(rows):
                for c in range(cols):
                    wx = bx + 6 + c * 14
                    wy = by + 10 + r * 18
                    if (c + r * 2 + b["window_pattern"]) % 4 == 0:
                        led_color = accent_color if (r + c) % 3 == 0 else (60, 75, 95)
                        pygame.draw.rect(surface, led_color, (wx, wy, 4, 6))

            # Antenna with blinking red beacon
            if b["has_tower"]:
                tx = bx + b["w"] // 2
                pygame.draw.line(surface, (45, 55, 70), (tx, by), (tx, by - 18), 2)
                if int(self.theme_timer * 3.0) % 2 == 0:
                    pygame.draw.circle(surface, (255, 40, 60), (tx, by - 18), 2)

    def _draw_data_streamers(self, surface: pygame.Surface, accent_color: tuple):
        """Renders drifting binary strings and terminal codes."""
        for stream in self.data_streamers:
            text_surf = self.font_terminal.render(stream["text"], True, (*accent_color[:3], stream["alpha"]))
            surface.blit(text_surf, (int(stream["x"]), int(stream["y"])))

    def _draw_ground_grid(self, surface: pygame.Surface, accent_color: tuple):
        """Renders perspective grid floor under player feet."""
        floor_h = SCREEN_HEIGHT - GROUND_Y

        # Dark sub-surface
        pygame.draw.rect(surface, (10, 14, 20), (0, GROUND_Y, SCREEN_WIDTH, floor_h))

        # Horizon Neon Laser Line
        pygame.draw.line(surface, accent_color, (0, GROUND_Y), (SCREEN_WIDTH, GROUND_Y), 3)
        pygame.draw.line(surface, COLOR_WHITE, (0, GROUND_Y), (SCREEN_WIDTH, GROUND_Y), 1)

        # Horizontal perspective grid lines
        for i in range(1, 6):
            gy = GROUND_Y + int(i * i * 3.0)
            if gy < SCREEN_HEIGHT:
                alpha = max(20, int(180 - i * 30))
                grid_surf = pygame.Surface((SCREEN_WIDTH, 2), pygame.SRCALPHA)
                grid_surf.fill((*accent_color[:3], alpha))
                surface.blit(grid_surf, (0, gy))

        # Vertical scrolling grid lines with perspective illusion
        spacing = 40.0
        offset = self.scroll_ground
        for gx in range(-int(spacing), SCREEN_WIDTH + int(spacing) * 2, int(spacing)):
            top_x = gx - offset
            bot_x = top_x - 35  # Tilted perspective
            pygame.draw.line(surface, (*COLOR_GRID, 140), (top_x, GROUND_Y + 1), (bot_x, SCREEN_HEIGHT), 1)
