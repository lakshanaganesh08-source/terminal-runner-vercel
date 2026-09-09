/**
 * Game Configuration and Constants for Terminal Runner (Web)
 * Preserves the exact physics, dimensions, colors, and difficulty curves of the original game.
 */

// Screen & Virtual Canvas
export const SCREEN_WIDTH = 1000;
export const SCREEN_HEIGHT = 400;
export const FPS = 60;
export const TITLE = "TERMINAL RUNNER";
export const GROUND_Y = 320; // Baseline where player feet rest

// Color Palette (Retro Cyberpunk / Terminal Theme)
export const COLOR_BG = "#0d1117";               // Deep Shell Black
export const COLOR_BG_ALT = "#121821";           // Subtle gradient night tone
export const COLOR_SURFACE = "#161b22";          // Panel / Surface
export const COLOR_GRID = "#212a36";             // Floor grid lines
export const COLOR_GRID_GLOW = "rgba(0, 255, 102, 0.24)"; // Floor horizon glow

// Neon Accents
export const COLOR_NEON_GREEN = "#00ff66";      // Phosphor Green (Player/System)
export const COLOR_NEON_CYAN = "#00f0ff";       // Electric Cyan (Shield/Data)
export const COLOR_NEON_PINK = "#ff007f";       // Cyberpunk Magenta (Obstacles/Drones)
export const COLOR_NEON_AMBER = "#ffaa00";      // Warning Amber (Spikes/2X Score)
export const COLOR_NEON_PURPLE = "#bc13fe";     // Deep Violet (Slow-Mo / EMP)
export const COLOR_NEON_RED = "#ff2244";        // Laser Red (Fatal Hazards)

// Neutral & Text Colors
export const COLOR_WHITE = "#e6edf3";           // Primary Crisp Text
export const COLOR_DIM = "#8b949e";             // Muted Monospace Text
export const COLOR_DARK_BORDER = "#30363d";      // Dark UI framing

// Physics Constants
export const GRAVITY = 0.82;
export const JUMP_VELOCITY = -14.2;
export const VARIABLE_JUMP_REDUCTION = 0.55;    // Velocity damping when releasing jump early
export const FAST_FALL_ACCEL = 1.75;            // Additional gravity multiplier when holding duck in air
export const DUCK_GROUND_GRAVITY = 1.4;

// Player Dimensions
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 56;
export const PLAYER_DUCK_WIDTH = 54;
export const PLAYER_DUCK_HEIGHT = 28;
export const PLAYER_START_X = 120;

// Gameplay & Difficulty Progression
export const INITIAL_WORLD_SPEED = 4.8;         // Smooth, approachable start speed
export const MAX_WORLD_SPEED = 12.5;            // Controlled max speed
export const SPEED_INCREASE_RATE = 0.0016;      // Gradual acceleration
export const MIN_OBSTACLE_SPAWN_DIST = 380;
export const MAX_OBSTACLE_SPAWN_DIST = 680;

// Power-up Durations (in seconds)
export const DURATION_DOUBLE_SCORE = 10.0;
export const DURATION_SLOW_MOTION = 8.0;
export const SLOW_MOTION_FACTOR = 0.52;

// Scoring
export const POINTS_PER_PIXEL = 0.1;            // Distance survival score
export const POINTS_DATA_BIT = 50;              // Bronze / Normal packet
export const POINTS_DATA_BYTE = 100;            // Silver / Enriched packet
export const POINTS_CRYPTO_BLOCK = 250;         // Quantum Gold block

// Storage Key
export const STORAGE_KEY_HIGHSCORE = "terminal_runner_highscore";
export const STORAGE_KEY_STATS = "terminal_runner_stats";
