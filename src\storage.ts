/**
 * LocalStorage Persistence Manager for Terminal Runner
 */

import { STORAGE_KEY_HIGHSCORE, STORAGE_KEY_STATS } from './config.ts';
import { GameStats } from './types.ts';

export class StorageManager {
  private inMemoryHighScore = 0;
  private inMemoryStats: GameStats = {
    highScore: 0,
    totalRuns: 0,
    totalDistance: 0,
    totalPackets: 0
  };

  constructor() {
    this.load();
  }

  public getHighScore(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HIGHSCORE);
      if (stored !== null) {
        const val = parseInt(stored, 10);
        if (!isNaN(val)) return val;
      }
    } catch {
      // Fallback
    }
    return this.inMemoryHighScore;
  }

  public saveHighScore(score: number): void {
    this.inMemoryHighScore = score;
    try {
      localStorage.setItem(STORAGE_KEY_HIGHSCORE, score.toString());
    } catch {
      // Ignore private browsing restrictions
    }
  }

  public getStats(): GameStats {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STATS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return this.inMemoryStats;
  }

  public recordRun(score: number, distance: number, packets: number): void {
    const stats = this.getStats();
    stats.totalRuns += 1;
    stats.totalDistance += Math.floor(distance);
    stats.totalPackets += packets;
    if (score > stats.highScore) {
      stats.highScore = score;
    }
    this.inMemoryStats = stats;
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch {
      // Ignore
    }
  }

  private load(): void {
    this.inMemoryHighScore = this.getHighScore();
    this.inMemoryStats = this.getStats();
  }
}
