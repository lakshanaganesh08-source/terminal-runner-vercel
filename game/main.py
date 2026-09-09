"""
Entry point for Terminal Runner game
"""

import sys
import os
import argparse

# Add parent directory to sys.path so imports work cleanly regardless of execution directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from game.game import Game


def main():
    parser = argparse.ArgumentParser(description="Terminal Runner - Cyberpunk 2D Endless Runner")
    parser.add_argument("--nosound", "--mute", action="store_true", help="Disable audio synthesis")
    parser.add_argument("--fullscreen", action="store_true", help="Launch in fullscreen mode")
    args = parser.parse_args()

    game = Game(sound_enabled=not args.nosound, fullscreen=args.fullscreen)
    game.run()


if __name__ == "__main__":
    main()
