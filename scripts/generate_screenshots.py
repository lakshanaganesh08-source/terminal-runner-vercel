"""
Generates visual snapshot captures of Terminal Runner states for verification & walkthrough.
"""

import os
import sys
import pygame

os.environ["SDL_VIDEODRIVER"] = "dummy"
os.environ["SDL_AUDIODRIVER"] = "dummy"

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from game.config import SCREEN_WIDTH, SCREEN_HEIGHT, GROUND_Y
from game.game import Game
from game.obstacle import FirewallSpikes, SecurityDrone, LaserBarrier
from game.collectible import Collectible
from game.powerup import PowerUpItem


def main():
    artifact_dir = r"C:\Users\Lakshana G S\.gemini\antigravity-ide\brain\cb47c9c7-98dc-4306-8136-6abe53f9819b"
    os.makedirs(artifact_dir, exist_ok=True)

    game = Game(sound_enabled=False)

    # 1. Capture Start Screen
    game.state = Game.STATE_START
    game.ui.cursor_timer = 0.5
    game.background.update(0.016, 2.0, 0.0)
    game.draw()
    start_path = os.path.join(artifact_dir, "screenshot_start.png")
    pygame.image.save(game.canvas, start_path)

    # 2. Capture Active Gameplay with Obstacles & Collectibles
    game.start_new_game()
    game.distance = 1840.0
    game.score = 4850
    game.high_score = 9200
    game.world_speed = 9.5

    # Place entities manually for an action-packed snapshot
    game.obstacle_spawner.obstacles.append(FirewallSpikes(480, cluster_size=2))
    game.obstacle_spawner.obstacles.append(SecurityDrone(720, altitude_type="high"))
    game.obstacle_spawner.obstacles.append(LaserBarrier(900))

    # Add collectibles in arc
    for i in range(4):
        game.collectible_spawner.collectibles.append(Collectible(280 + i * 36, GROUND_Y - 40 - i * 15, "byte"))

    # Add floating score popup
    game.particles.add_floating_text("+100 (2X)", 220, 220, (255, 230, 80), 18)
    game.particles.emit_run_sparks(game.player.x + 12, GROUND_Y - 1)

    game.update(0.016)
    game.draw()
    gameplay_path = os.path.join(artifact_dir, "screenshot_gameplay.png")
    pygame.image.save(game.canvas, gameplay_path)

    # 3. Capture Active Shield & Slow-Mo state
    game.player.has_shield = True
    game.powerup_mgr.double_score_timer = 7.4
    game.powerup_mgr.slow_motion_timer = 5.2
    game.particles.emit_powerup_flash(game.player.x + 20, game.player.y + 20, (0, 240, 255))

    game.update(0.016)
    game.draw()
    shield_path = os.path.join(artifact_dir, "screenshot_shield.png")
    pygame.image.save(game.canvas, shield_path)

    # 4. Capture Game Over Screen
    game.state = Game.STATE_GAME_OVER
    game.is_new_record = True
    game.score = 12450
    game.high_score = 12450
    game.packets_collected = 38
    game.ui.cursor_timer = 0.5
    game.draw()
    gameover_path = os.path.join(artifact_dir, "screenshot_gameover.png")
    pygame.image.save(game.canvas, gameover_path)

    print("Screenshots generated successfully!")


if __name__ == "__main__":
    main()
