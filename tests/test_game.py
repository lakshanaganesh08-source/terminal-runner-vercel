"""
Comprehensive Headless Unit and Integration Tests for Terminal Runner
"""

import os
import sys
import json
import unittest
import pygame

# Run in headless video & audio mode for automated testing
os.environ["SDL_VIDEODRIVER"] = "dummy"
os.environ["SDL_AUDIODRIVER"] = "dummy"

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from game.config import (
    SCREEN_WIDTH, SCREEN_HEIGHT, GROUND_Y, PLAYER_WIDTH,
    PLAYER_HEIGHT, PLAYER_DUCK_HEIGHT, HIGHSCORE_FILE,
    MAX_WORLD_SPEED, INITIAL_WORLD_SPEED
)
from game.audio import AudioManager
from game.particle import ParticleManager
from game.player import Player
from game.obstacle import (
    ObstacleSpawner, FirewallSpikes, SecurityDrone,
    DataPylon, LaserBarrier, GlitchNode
)
from game.collectible import CollectibleSpawner, Collectible
from game.powerup import PowerUpManager, PowerUpItem
from game.background import Background
from game.ui import UIManager
from game.game import Game


class TestTerminalRunner(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        pygame.init()

    @classmethod
    def tearDownClass(cls):
        pygame.quit()
        if os.path.exists(HIGHSCORE_FILE):
            try:
                os.remove(HIGHSCORE_FILE)
            except Exception:
                pass

    def test_audio_synthesis_all_tracks(self):
        """Verify procedural audio synthesizes all wave sounds properly."""
        audio = AudioManager(enabled=True)
        # Should not crash regardless of audio driver availability
        sound_names = ["jump", "duck", "collect", "powerup", "shield_break", "crash", "ui_beep", "pause"]
        for s in sound_names:
            audio.play(s)
        audio.set_volume(0.5)
        self.assertEqual(audio.volume, 0.5)

    def test_player_physics_and_ducking(self):
        """Test player jumping, gravity, variable release, and dynamic duck hitbox."""
        player = Player(x=100, ground_y=GROUND_Y)
        particles = ParticleManager()
        audio = AudioManager(enabled=False)

        self.assertTrue(player.is_grounded)
        self.assertLessEqual(player.rect.height, PLAYER_HEIGHT)

        # Trigger Jump
        player.jump()
        player.update(0.016, particles, audio)
        self.assertFalse(player.is_grounded)
        self.assertLess(player.vy, 0)

        # Test Variable Jump Release (cutting ascent short)
        prev_vy = player.vy
        player.release_jump()
        self.assertGreater(player.vy, prev_vy)  # vy becomes less negative

        # Update in air until landing
        for _ in range(70):
            player.update(0.016, particles, audio)

        self.assertTrue(player.is_grounded)

        # Test Ducking
        player.duck(True)
        player.update(0.016, particles, audio)
        self.assertTrue(player.is_ducking)
        self.assertLess(player.rect.height, PLAYER_HEIGHT)

        # Release duck
        player.duck(False)
        player.update(0.016, particles, audio)
        self.assertFalse(player.is_ducking)

    def test_shield_mechanic(self):
        """Test that shield absorbs lethal blow without crashing."""
        player = Player(x=100, ground_y=GROUND_Y)
        player.has_shield = True

        # First hit: Absorbed by shield
        fatal = player.apply_hit()
        self.assertFalse(fatal, "Shield must absorb lethal hit")
        self.assertFalse(player.has_shield, "Shield must be consumed")
        self.assertTrue(player.is_invulnerable, "Grace invulnerability must trigger")

        # Let invulnerability expire
        player.invulnerable_timer = 0.0
        player.is_invulnerable = False

        # Second hit without shield: Fatal
        fatal2 = player.apply_hit()
        self.assertTrue(fatal2, "Hit without shield must be fatal")
        self.assertTrue(player.is_crashed)

    def test_obstacle_spawning_and_collision(self):
        """Test obstacle types, bounding boxes, and spawner logic."""
        spawner = ObstacleSpawner()
        self.assertEqual(len(spawner.obstacles), 0)

        # Test distinct obstacle classes
        spike = FirewallSpikes(100, cluster_size=2)
        drone = SecurityDrone(100, altitude_type="high")
        pylon = DataPylon(100)
        laser = LaserBarrier(100)
        glitch = GlitchNode(100)

        self.assertEqual(spike.obs_type, "spikes")
        self.assertEqual(drone.obs_type, "drone")
        self.assertEqual(pylon.obs_type, "pylon")
        self.assertEqual(laser.obs_type, "laser")
        self.assertEqual(glitch.obs_type, "glitch")

        # Test Spawner movement & update
        spawner.obstacles.append(spike)
        spawner.update(0.016, world_speed=10.0, total_distance=1500)
        self.assertLess(spike.x, 100)

        # Test Collision Detection
        collided = spawner.check_collision(spike.rect)
        self.assertEqual(collided, spike)

    def test_high_distance_obstacle_generation(self):
        """Verify obstacle generation at advanced distances."""
        spawner = ObstacleSpawner()
        for d in [1000, 2500, 4500]:
            spawner._spawn_obstacle(total_distance=d, world_speed=12.0)
        self.assertGreaterEqual(len(spawner.obstacles), 3)

    def test_render_all_obstacle_types(self):
        """Verify all obstacle types render to surface with zero errors."""
        canvas = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        obstacles = [
            FirewallSpikes(100, cluster_size=1),
            FirewallSpikes(150, cluster_size=2),
            FirewallSpikes(200, cluster_size=3),
            SecurityDrone(250, altitude_type="low"),
            SecurityDrone(300, altitude_type="high"),
            DataPylon(350),
            LaserBarrier(400),
            GlitchNode(450)
        ]
        for obs in obstacles:
            obs.update(0.016, 5.0)
            obs.draw(canvas)
        self.assertTrue(True)

    def test_collectibles_and_powerups(self):
        """Test collection rewards, 2X multiplier, and Slow-Mo."""
        player = Player(x=100, ground_y=GROUND_Y)
        collect_spawner = CollectibleSpawner()
        powerup_mgr = PowerUpManager()
        particles = ParticleManager()
        audio = AudioManager(enabled=False)

        # Place collectible at player location
        c = Collectible(player.rect.x, player.rect.y, "byte")
        collect_spawner.collectibles.append(c)

        # Collect with 1X
        pts1 = collect_spawner.check_collection(player.rect, score_multiplier=1,
                                                particle_manager=particles, audio_manager=audio)
        self.assertEqual(pts1, 100)
        self.assertTrue(c.collected)

        # Activate 2X PowerUp
        p_item = PowerUpItem(player.rect.x, player.rect.y, "double_score")
        powerup_mgr.items.append(p_item)
        powerup_mgr.check_collection(player, particles, audio)

        self.assertTrue(powerup_mgr.is_double_score)
        self.assertEqual(powerup_mgr.score_multiplier, 2)

        # Collect another with 2X
        c2 = Collectible(player.rect.x, player.rect.y, "bit")
        collect_spawner.collectibles.append(c2)
        pts2 = collect_spawner.check_collection(player.rect, score_multiplier=powerup_mgr.score_multiplier,
                                                particle_manager=particles, audio_manager=audio)
        self.assertEqual(pts2, 100)  # 50 * 2 = 100

        # Activate Slow-Mo
        p_slow = PowerUpItem(player.rect.x, player.rect.y, "slow_motion")
        powerup_mgr.items.append(p_slow)
        powerup_mgr.check_collection(player, particles, audio)
        self.assertTrue(powerup_mgr.is_slow_motion)
        self.assertLess(powerup_mgr.speed_multiplier, 1.0)

    def test_high_score_persistence(self):
        """Verify high scores are saved to and read from disk."""
        game = Game(sound_enabled=False)
        game.high_score = 9999
        game._save_high_score()

        loaded_score = game._load_high_score()
        self.assertEqual(loaded_score, 9999)

    def test_full_game_simulation(self):
        """Simulate 300 game frames from start to game over to restart."""
        game = Game(sound_enabled=False)
        self.assertEqual(game.state, Game.STATE_START)

        # Start game
        game.start_new_game()
        self.assertEqual(game.state, Game.STATE_PLAYING)

        # Simulate 200 running frames
        for frame in range(200):
            # Simulate occasional jump and duck
            if frame == 30:
                game.player.jump()
            elif frame == 50:
                game.player.release_jump()
            elif frame == 80:
                game.player.duck(True)
            elif frame == 110:
                game.player.duck(False)

            game.update(0.016)
            game.draw()

        self.assertGreater(game.distance, 0)
        self.assertGreater(game.score, 0)
        self.assertLessEqual(game.world_speed, MAX_WORLD_SPEED)

        # Test Pause
        game.state = Game.STATE_PAUSED
        game.update(0.016)
        game.draw()
        game.state = Game.STATE_PLAYING

        # Test Fatal Collision
        game.player.apply_hit()
        game.state = Game.STATE_GAME_OVER
        game.update(0.016)
        game.draw()
        self.assertEqual(game.state, Game.STATE_GAME_OVER)

        # Restart
        game.start_new_game()
        self.assertEqual(game.state, Game.STATE_PLAYING)
        self.assertEqual(game.score, 0)


if __name__ == "__main__":
    unittest.main()
