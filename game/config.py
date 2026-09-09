"""
Game Configuration and Constants for Terminal Runner
"""

# Screen & Window
SCREEN_WIDTH = 1000
SCREEN_HEIGHT = 400
FPS = 60
TITLE = "TERMINAL RUNNER"
GROUND_Y = 320  # Baseline where player feet rest

# Color Palette (Retro Cyberpunk / Terminal Theme)
COLOR_BG = (13, 17, 23)                # #0d1117 (Deep Shell Black)
COLOR_BG_ALT = (18, 24, 33)            # #121821 (Subtle gradient night tone)
COLOR_SURFACE = (22, 27, 34)           # #161b22 (Panel / Surface)
COLOR_GRID = (33, 42, 54)              # #212a36 (Floor grid lines)
COLOR_GRID_GLOW = (0, 255, 102, 60)    # Floor horizon glow

# Neon Accents
COLOR_NEON_GREEN = (0, 255, 102)       # Phosphor Green (Player/System)
COLOR_NEON_CYAN = (0, 240, 255)        # Electric Cyan (Shield/Data)
COLOR_NEON_PINK = (255, 0, 127)        # Cyberpunk Magenta (Obstacles/Drones)
COLOR_NEON_AMBER = (255, 170, 0)       # Warning Amber (Spikes/2X Score)
COLOR_NEON_PURPLE = (188, 19, 254)     # Deep Violet (Slow-Mo / EMP)
COLOR_NEON_RED = (255, 34, 68)         # Laser Red (Fatal Hazards)

# Neutral & Text Colors
COLOR_WHITE = (230, 237, 243)          # Primary Crisp Text
COLOR_DIM = (139, 148, 158)            # Muted Monospace Text
COLOR_DARK_BORDER = (48, 54, 61)       # Dark UI framing

# Physics Constants
GRAVITY = 0.82
JUMP_VELOCITY = -14.2
VARIABLE_JUMP_REDUCTION = 0.55         # Velocity damping when releasing jump early
FAST_FALL_ACCEL = 1.75                 # Additional gravity multiplier when holding duck in air
DUCK_GROUND_GRAVITY = 1.4

# Player Dimensions
PLAYER_WIDTH = 40
PLAYER_HEIGHT = 56
PLAYER_DUCK_WIDTH = 54
PLAYER_DUCK_HEIGHT = 28
PLAYER_START_X = 120

# Gameplay & Difficulty Progression
INITIAL_WORLD_SPEED = 4.8              # Smooth, approachable start speed
MAX_WORLD_SPEED = 12.5                 # Controlled max speed
SPEED_INCREASE_RATE = 0.0016           # Gradual acceleration
MIN_OBSTACLE_SPAWN_DIST = 380
MAX_OBSTACLE_SPAWN_DIST = 680

# Power-up Durations (in seconds)
DURATION_DOUBLE_SCORE = 10.0
DURATION_SLOW_MOTION = 8.0
SLOW_MOTION_FACTOR = 0.52

# Scoring
POINTS_PER_PIXEL = 0.1                 # Distance survival score
POINTS_DATA_BIT = 50                   # Bronze / Normal packet
POINTS_DATA_BYTE = 100                 # Silver / Enriched packet
POINTS_CRYPTO_BLOCK = 250              # Quantum Gold block

# File Paths
HIGHSCORE_FILE = "highscore.json"

# Audio Settings
AUDIO_CHANNELS = 8
AUDIO_SAMPLE_RATE = 22050
AUDIO_BUFFER = 512
DEFAULT_VOLUME = 0.7
