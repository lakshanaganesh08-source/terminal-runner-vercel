"""
Main Game Loop, State Machine, and Systems Coordinator for Terminal Runner
"""

import os
import json
import random
import pygame
from game.config import (
    SCREEN_WIDTH, SCREEN_HEIGHT, FPS, TITLE,
    INITIAL_WORLD_SPEED, MAX_WORLD_SPEED, SPEED_INCREASE_RATE,
    POINTS_PER_PIXEL, HIGHSCORE_FILE, COLOR_BG
)
from game.player import Player
from game.obstacle import ObstacleSpawner
from game.collectible import CollectibleSpawner
from game.powerup import PowerUpManager
from game.background import Background
from game.particle import ParticleManager
from game.audio import AudioManager
from game.ui import UIManager


class Game:
    """Core game manager handling state transitions, loops, physics, and rendering."""

    STATE_START = 0
    STATE_PLAYING = 1
    STATE_PAUSED = 2
    STATE_GAME_OVER = 3

    def __init__(self, sound_enabled: bool = True, fullscreen: bool = False):
        pygame.init()
        pygame.display.set_caption(TITLE)

        # Main window and virtual rendering canvas
        flags = pygame.FULLSCREEN if fullscreen else pygame.RESIZABLE
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT), flags)
        self.canvas = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        self.clock = pygame.time.Clock()
        self.running = True

        # Systems
        self.audio = AudioManager(enabled=sound_enabled)
        self.particles = ParticleManager()
        self.background = Background()
        self.ui = UIManager()
        self.player = Player()
        self.obstacle_spawner = ObstacleSpawner()
        self.collectible_spawner = CollectibleSpawner()
        self.powerup_mgr = PowerUpManager()

        # Game State
        self.state = self.STATE_START
        self.score = 0
        self.score_float = 0.0
        self.high_score = self._load_high_score()
        self.is_new_record = False
        self.distance = 0.0
        self.world_speed = INITIAL_WORLD_SPEED
        self.packets_collected = 0

        # Screen Shake
        self.shake_duration = 0.0
        self.shake_magnitude = 0.0

    def _load_high_score(self) -> int:
        """Loads persistent high score from local json file."""
        if os.path.exists(HIGHSCORE_FILE):
            try:
                with open(HIGHSCORE_FILE, "r") as f:
                    data = json.load(f)
                    return int(data.get("high_score", 0))
            except Exception:
                return 0
        return 0

    def _save_high_score(self):
        """Saves persistent high score to local json file."""
        try:
            with open(HIGHSCORE_FILE, "w") as f:
                json.dump({"high_score": self.high_score}, f)
        except Exception:
            pass

    def start_new_game(self):
        """Initializes a fresh game run."""
        self.state = self.STATE_PLAYING
        self.score = 0
        self.score_float = 0.0
        self.distance = 0.0
        self.world_speed = INITIAL_WORLD_SPEED
        self.packets_collected = 0
        self.is_new_record = False
        self.shake_duration = 0.0
        self.shake_magnitude = 0.0

        self.player.reset()
        self.obstacle_spawner.clear()
        self.collectible_spawner.clear()
        self.powerup_mgr.reset()
        self.particles.clear()
        self.background.reset()

        self.audio.play("ui_beep")

    def trigger_shake(self, magnitude: float = 6.0, duration: float = 0.25):
        """Applies camera screen shake effect."""
        self.shake_magnitude = magnitude
        self.shake_duration = duration

    def handle_events(self):
        """Processes keyboard and window events."""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False

            elif event.type == pygame.VIDEORESIZE:
                # Handle window resizing gracefully
                self.screen = pygame.display.set_mode((event.w, event.h), pygame.RESIZABLE)

            elif event.type == pygame.KEYDOWN:
                # Restart hotkey anytime
                if event.key == pygame.K_r:
                    self.start_new_game()

                # Pause toggle
                elif event.key in (pygame.K_ESCAPE, pygame.K_p):
                    if self.state == self.STATE_PLAYING:
                        self.state = self.STATE_PAUSED
                        self.audio.play("pause")
                    elif self.state == self.STATE_PAUSED:
                        self.state = self.STATE_PLAYING
                        self.audio.play("ui_beep")

                # Action inputs (Jump / Start)
                elif event.key in (pygame.K_SPACE, pygame.K_UP):
                    if self.state == self.STATE_START:
                        self.start_new_game()
                    elif self.state == self.STATE_GAME_OVER:
                        self.start_new_game()
                    elif self.state == self.STATE_PLAYING:
                        self.player.jump()

                # Duck input
                elif event.key == pygame.K_DOWN:
                    if self.state == self.STATE_PLAYING:
                        self.player.duck(True)
                        self.audio.play("duck")

            elif event.type == pygame.KEYUP:
                if event.key in (pygame.K_SPACE, pygame.K_UP):
                    if self.state == self.STATE_PLAYING:
                        self.player.release_jump()

                elif event.key == pygame.K_DOWN:
                    if self.state == self.STATE_PLAYING:
                        self.player.duck(False)

    def update(self, dt: float):
        """Updates game state, physics, collisions, and scoring."""
        self.ui.update(dt)

        if self.state == self.STATE_PAUSED:
            return

        # Update screen shake
        if self.shake_duration > 0:
            self.shake_duration -= dt
            if self.shake_duration <= 0:
                self.shake_magnitude = 0.0

        if self.state == self.STATE_PLAYING:
            # Calculate world speed based on progression & slow-motion
            base_speed = min(MAX_WORLD_SPEED, INITIAL_WORLD_SPEED + self.distance * SPEED_INCREASE_RATE)
            effective_speed = base_speed * self.powerup_mgr.speed_multiplier
            self.world_speed = effective_speed

            # Distance & continuous score
            dist_delta = effective_speed * dt * 60.0
            self.distance += dist_delta
            self.score_float += dist_delta * POINTS_PER_PIXEL * self.powerup_mgr.score_multiplier
            self.score = int(self.score_float)

            # Check new high score during run
            if self.score > self.high_score:
                if not self.is_new_record and self.high_score > 0:
                    self.particles.add_floating_text("NEW RECORD!", SCREEN_WIDTH // 2, 80, (255, 215, 0), 20)
                self.high_score = self.score
                self.is_new_record = True

            # Update game entities
            self.background.update(dt, effective_speed, self.distance)
            self.player.update(dt, self.particles, self.audio)
            self.obstacle_spawner.update(dt, effective_speed, self.distance)
            self.collectible_spawner.update(dt, effective_speed, self.distance)
            self.powerup_mgr.update(dt, effective_speed, self.player, self.distance)
            self.particles.update(dt, effective_speed)

            # 1. Check Collectibles Collision
            earned_pts = self.collectible_spawner.check_collection(
                self.player.rect,
                score_multiplier=self.powerup_mgr.score_multiplier,
                particle_manager=self.particles,
                audio_manager=self.audio
            )
            if earned_pts > 0:
                self.score_float += earned_pts
                self.score = int(self.score_float)
                self.packets_collected += 1
                if self.score > self.high_score:
                    self.high_score = self.score
                    self.is_new_record = True

            # 2. Check Power-Ups Collision
            self.powerup_mgr.check_collection(self.player, self.particles, self.audio)

            # 3. Check Obstacles Collision
            colliding_obs = self.obstacle_spawner.check_collision(self.player.rect)
            if colliding_obs:
                fatal = self.player.apply_hit()
                if fatal:
                    # Crash & Game Over
                    self.state = self.STATE_GAME_OVER
                    self.trigger_shake(magnitude=12.0, duration=0.45)
                    self.particles.emit_player_crash(self.player.x + 20, self.player.y + 25)
                    self.audio.play("crash")
                    self._save_high_score()
                else:
                    # Shield absorbed hit
                    self.trigger_shake(magnitude=5.0, duration=0.20)
                    self.particles.emit_shield_break(self.player.x + 20, self.player.y + 25)
                    self.particles.add_floating_text("SHIELD BROKEN!", self.player.x, self.player.y - 20, (255, 100, 100), 16)
                    self.audio.play("shield_break")

        elif self.state in (self.STATE_START, self.STATE_GAME_OVER):
            # Gentle ambient background scrolling on menus
            self.background.update(dt, 2.0, 0.0)
            self.player.update(dt, self.particles, self.audio)
            self.particles.update(dt, 2.0)

    def draw(self):
        """Draws virtual canvas and scales to current window size."""
        # 1. Render World to Canvas
        self.canvas.fill(COLOR_BG)

        # Draw Background
        self.background.draw(self.canvas, self.distance)

        # Draw Collectibles & Power-Ups
        self.collectible_spawner.draw(self.canvas)
        self.powerup_mgr.draw(self.canvas)

        # Draw Obstacles
        self.obstacle_spawner.draw(self.canvas)

        # Draw Player
        self.player.draw(self.canvas)

        # Draw Particles & Popups
        self.particles.draw(self.canvas)

        # Draw HUD (if playing or game over)
        self.ui.draw_hud(self.canvas, self.score, self.high_score, self.powerup_mgr, self.player, self.world_speed)

        # Draw Screen Overlays
        if self.state == self.STATE_START:
            self.ui.draw_start_screen(self.canvas)
        elif self.state == self.STATE_PAUSED:
            self.ui.draw_pause_screen(self.canvas)
        elif self.state == self.STATE_GAME_OVER:
            self.ui.draw_game_over_screen(
                self.canvas, self.score, self.high_score,
                self.distance, self.packets_collected, self.is_new_record
            )

        # Apply CRT Scanlines
        self.ui.draw_scanlines(self.canvas)

        # 2. Render Canvas with Screen Shake to Main Window
        shake_ox = 0
        shake_oy = 0
        if self.shake_duration > 0:
            shake_ox = random.randint(-int(self.shake_magnitude), int(self.shake_magnitude))
            shake_oy = random.randint(-int(self.shake_magnitude), int(self.shake_magnitude))

        # Scale canvas to window preserving aspect ratio
        win_w, win_h = self.screen.get_size()
        if win_w == SCREEN_WIDTH and win_h == SCREEN_HEIGHT:
            self.screen.blit(self.canvas, (shake_ox, shake_oy))
        else:
            scaled_surf = pygame.transform.smoothscale(self.canvas, (win_w, win_h))
            self.screen.blit(scaled_surf, (shake_ox, shake_oy))

        pygame.display.flip()

    def run(self):
        """Main game loop with fixed delta time."""
        while self.running:
            dt = self.clock.tick(FPS) / 1000.0
            # Clamp dt to prevent physics tunneling on lag spikes
            dt = min(dt, 0.05)

            self.handle_events()
            self.update(dt)
            self.draw()

        self._save_high_score()
        pygame.quit()
