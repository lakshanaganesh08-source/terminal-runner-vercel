/**
 * TypeScript Interfaces and Types for Terminal Runner
 */

export enum GameState {
  START = 0,
  PLAYING = 1,
  PAUSED = 2,
  GAME_OVER = 3
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ParticleItem {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  initialSize: number;
  size: number;
  life: number;
  maxLife: number;
  shape: 'rect' | 'circle' | 'spark' | 'ring';
  gravity: number;
  drag: number;
  fade: boolean;
  shrink: boolean;
  alive: boolean;
}

export interface FloatingTextItem {
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alive: boolean;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export interface CityBuilding {
  x: number;
  w: number;
  h: number;
  hasTower: boolean;
  windowPattern: number;
}

export interface DataStreamer {
  text: string;
  x: number;
  y: number;
  speedMod: number;
  alpha: number;
}

export type CollectibleTier = 'bit' | 'byte' | 'crypto';
export type PowerUpType = 'shield' | 'double_score' | 'slow_motion';
export type ObstacleType = 'spikes' | 'drone' | 'pylon' | 'laser' | 'glitch';

export interface GameStats {
  highScore: number;
  totalRuns: number;
  totalDistance: number;
  totalPackets: number;
}
