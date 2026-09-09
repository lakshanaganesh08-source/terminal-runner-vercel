"""
User Interface, HUD, CRT Scanline Overlay, and Menu Screens for Terminal Runner
"""

import math
import pygame
from game.config import (
    SCREEN_WIDTH, SCREEN_HEIGHT, COLOR_NEON_GREEN, COLOR_NEON_CYAN,
    COLOR_NEON_PINK, COLOR_NEON_AMBER, COLOR_NEON_PURPLE, COLOR_NEON_RED,
    COLOR_WHITE, COLOR_DIM, COLOR_SURFACE, COLOR_BG, COLOR_DARK_BORDER
)


class UIManager:
    """Renders all game HUD elements, screen overlays, and status menus."""

    def __init__(self):
        # Fonts
        self.font_title = pygame.font.SysFont("Consolas, Courier, monospace", 38, bold=True)
        self.font_sub = pygame.font.SysFont("Consolas, Courier, monospace", 18, bold=True)
        self.font_hud = pygame.font.SysFont("Consolas, Courier, monospace", 20, bold=True)
        self.font_small = pygame.font.SysFont("Consolas, Courier, monospace", 13)
        self.font_badge = pygame.font.SysFont("Consolas, Courier, monospace", 12, bold=True)

        self.cursor_timer = 0.0
        self.scanline_surface = self._create_scanlines()

    def _create_scanlines(self) -> pygame.Surface:
        """Pre-renders semi-transparent CRT scanlines surface."""
        surf = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        for y in range(0, SCREEN_HEIGHT, 3):
            pygame.draw.line(surf, (0, 0, 0, 32), (0, y), (SCREEN_WIDTH, y), 1)
        # Vignette subtle dark corners
        pygame.draw.rect(surf, (0, 0, 0, 80), (0, 0, SCREEN_WIDTH, SCREEN_HEIGHT), width=3)
        return surf

    def update(self, dt: float):
        self.cursor_timer += dt

    def draw_hud(self, surface: pygame.Surface, score: int, high_score: int,
                 powerup_mgr, player, world_speed: float):
        """Draws top HUD: HI 000000, SCORE 000000, speed, and active power-ups."""
        # Top-Left: High Score
        hi_text = f"HI {high_score:06d}"
        hi_surf = self.font_hud.render(hi_text, True, COLOR_DIM)
        surface.blit(hi_surf, (24, 16))

        # Top-Right: Current Score
        score_color = COLOR_NEON_GREEN if not powerup_mgr.is_double_score else COLOR_NEON_AMBER
        score_text = f"SCORE {score:06d}"
        score_surf = self.font_hud.render(score_text, True, score_color)
        score_rect = score_surf.get_rect(topright=(SCREEN_WIDTH - 24, 16))
        surface.blit(score_surf, score_rect)

        # Center Status Badges (Active Power-Ups)
        badge_x = SCREEN_WIDTH // 2 - 120
        badge_y = 14

        # 1. Shield Badge
        if player.has_shield:
            self._draw_badge(surface, badge_x, badge_y, "SHIELD", COLOR_NEON_CYAN, 1.0)
            badge_x += 90

        # 2. 2X Score Multiplier Badge
        if powerup_mgr.is_double_score:
            ratio = powerup_mgr.double_score_timer / 10.0
            self._draw_badge(surface, badge_x, badge_y, f"2X {powerup_mgr.double_score_timer:.1f}s",
                             COLOR_NEON_AMBER, ratio)
            badge_x += 90

        # 3. Slow-Mo Badge
        if powerup_mgr.is_slow_motion:
            ratio = powerup_mgr.slow_motion_timer / 8.0
            self._draw_badge(surface, badge_x, badge_y, f"SLOW {powerup_mgr.slow_motion_timer:.1f}s",
                             COLOR_NEON_PURPLE, ratio)

    def _draw_badge(self, surface: pygame.Surface, x: int, y: int, label: str, color: tuple, progress: float):
        """Renders an active power-up HUD badge with mini countdown bar."""
        bw = 82
        bh = 22
        badge_surf = pygame.Surface((bw, bh), pygame.SRCALPHA)
        pygame.draw.rect(badge_surf, (15, 20, 28, 220), (0, 0, bw, bh), border_radius=4)
        pygame.draw.rect(badge_surf, color, (0, 0, bw, bh), width=1, border_radius=4)

        # Progress fill bar at bottom
        fill_w = max(2, int((bw - 4) * progress))
        pygame.draw.rect(badge_surf, color, (2, bh - 3, fill_w, 2))

        # Text label
        text_surf = self.font_badge.render(label, True, color)
        t_rect = text_surf.get_rect(center=(bw // 2, (bh - 2) // 2))
        badge_surf.blit(text_surf, t_rect)

        surface.blit(badge_surf, (x, y))

    def draw_start_screen(self, surface: pygame.Surface):
        """Draws retro cyberpunk start screen with terminal aesthetic."""
        # Backdrop dim
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((8, 12, 18, 180))
        surface.blit(overlay, (0, 0))

        # Title Box
        box_w = 640
        box_h = 240
        box_rect = pygame.Rect(SCREEN_WIDTH // 2 - box_w // 2, SCREEN_HEIGHT // 2 - box_h // 2, box_w, box_h)
        pygame.draw.rect(surface, (15, 20, 28, 240), box_rect, border_radius=8)
        pygame.draw.rect(surface, COLOR_NEON_GREEN, box_rect, width=2, border_radius=8)

        # Header Title
        title_surf = self.font_title.render("TERMINAL RUNNER", True, COLOR_NEON_GREEN)
        t_rect = title_surf.get_rect(center=(SCREEN_WIDTH // 2, box_rect.top + 45))
        surface.blit(title_surf, t_rect)

        sub_surf = self.font_small.render("[v1.0.0 // CYBERNETIC PROTOCOL ACTIVE]", True, COLOR_DIM)
        s_rect = sub_surf.get_rect(center=(SCREEN_WIDTH // 2, box_rect.top + 80))
        surface.blit(sub_surf, s_rect)

        # Blinking Start Prompt
        cursor_visible = int(self.cursor_timer * 2.5) % 2 == 0
        prompt_text = "> PRESS [SPACE] OR [UP] TO INITIATE <" if cursor_visible else "  PRESS [SPACE] OR [UP] TO INITIATE  "
        prompt_surf = self.font_sub.render(prompt_text, True, COLOR_NEON_CYAN)
        p_rect = prompt_surf.get_rect(center=(SCREEN_WIDTH // 2, box_rect.top + 130))
        surface.blit(prompt_surf, p_rect)

        # Controls list
        ctrl_text = "[SPACE/UP] JUMP  |  [DOWN] DUCK / SLIDE  |  [P/ESC] PAUSE  |  [R] RESTART"
        ctrl_surf = self.font_small.render(ctrl_text, True, COLOR_WHITE)
        c_rect = ctrl_surf.get_rect(center=(SCREEN_WIDTH // 2, box_rect.bottom - 30))
        surface.blit(ctrl_surf, c_rect)

    def draw_pause_screen(self, surface: pygame.Surface):
        """Draws pause overlay."""
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((8, 12, 18, 200))
        surface.blit(overlay, (0, 0))

        box_w = 460
        box_h = 160
        box_rect = pygame.Rect(SCREEN_WIDTH // 2 - box_w // 2, SCREEN_HEIGHT // 2 - box_h // 2, box_w, box_h)
        pygame.draw.rect(surface, (15, 20, 28), box_rect, border_radius=6)
        pygame.draw.rect(surface, COLOR_NEON_CYAN, box_rect, width=2, border_radius=6)

        title_surf = self.font_title.render("SYSTEM PAUSED", True, COLOR_NEON_CYAN)
        surface.blit(title_surf, title_surf.get_rect(center=(SCREEN_WIDTH // 2, box_rect.top + 45)))

        prompt_surf = self.font_sub.render("PRESS [P] OR [ESC] TO RESUME", True, COLOR_WHITE)
        surface.blit(prompt_surf, prompt_surf.get_rect(center=(SCREEN_WIDTH // 2, box_rect.top + 95)))

        sub_surf = self.font_small.render("PRESS [R] TO REBOOT SYSTEM", True, COLOR_DIM)
        surface.blit(sub_surf, sub_surf.get_rect(center=(SCREEN_WIDTH // 2, box_rect.bottom - 22)))

    def draw_game_over_screen(self, surface: pygame.Surface, score: int, high_score: int,
                              distance: float, packets_collected: int, is_new_record: bool):
        """Draws game over terminal breakdown."""
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((16, 8, 12, 215))
        surface.blit(overlay, (0, 0))

        box_w = 560
        box_h = 260
        box_rect = pygame.Rect(SCREEN_WIDTH // 2 - box_w // 2, SCREEN_HEIGHT // 2 - box_h // 2, box_w, box_h)
        pygame.draw.rect(surface, (20, 14, 20), box_rect, border_radius=8)
        pygame.draw.rect(surface, COLOR_NEON_RED, box_rect, width=2, border_radius=8)

        # Header
        title_surf = self.font_title.render("SYSTEM FAILURE", True, COLOR_NEON_RED)
        surface.blit(title_surf, title_surf.get_rect(center=(SCREEN_WIDTH // 2, box_rect.top + 40)))

        # New Record notification
        if is_new_record:
            rec_surf = self.font_small.render("*** NEW HIGH SCORE ESTABLISHED ***", True, COLOR_NEON_AMBER)
            surface.blit(rec_surf, rec_surf.get_rect(center=(SCREEN_WIDTH // 2, box_rect.top + 75)))

        # Stats Breakdown
        line1 = f"FINAL SCORE : {score:06d}     HIGH SCORE : {high_score:06d}"
        s1 = self.font_sub.render(line1, True, COLOR_WHITE)
        surface.blit(s1, s1.get_rect(center=(SCREEN_WIDTH // 2, box_rect.top + 110)))

        line2 = f"DISTANCE : {int(distance)} m     DATA PACKETS : {packets_collected}"
        s2 = self.font_small.render(line2, True, COLOR_DIM)
        surface.blit(s2, s2.get_rect(center=(SCREEN_WIDTH // 2, box_rect.top + 145)))

        # Restart prompt
        cursor_visible = int(self.cursor_timer * 3.0) % 2 == 0
        prompt_text = "> PRESS [R] OR [SPACE] TO RESTART <" if cursor_visible else "  PRESS [R] OR [SPACE] TO RESTART  "
        prompt_surf = self.font_sub.render(prompt_text, True, COLOR_NEON_GREEN)
        surface.blit(prompt_surf, prompt_surf.get_rect(center=(SCREEN_WIDTH // 2, box_rect.bottom - 42)))

    def draw_scanlines(self, surface: pygame.Surface):
        """Applies retro scanlines to final frame."""
        surface.blit(self.scanline_surface, (0, 0))
