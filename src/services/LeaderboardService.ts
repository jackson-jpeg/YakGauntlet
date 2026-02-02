import type { LeaderboardEntry } from '../types';
import { ErrorHandler, MemoryStorage } from '../utils/ErrorHandler';

const LEADERBOARD_KEY = 'yak_gauntlet_leaderboard';
const MAX_ENTRIES = 10;

class LeaderboardServiceClass {
  private leaderboard: LeaderboardEntry[] = [];
  private useMemoryStorage = false;

  constructor() {
    this.loadLeaderboard();
  }

  private loadLeaderboard(): void {
    ErrorHandler.withErrorHandlingSync(
      'LeaderboardService',
      'loadLeaderboard',
      () => {
        // Check if localStorage is available
        if (!ErrorHandler.isLocalStorageAvailable()) {
          console.warn('localStorage not available, using memory storage');
          this.useMemoryStorage = true;
          const memData = MemoryStorage.getItem(LEADERBOARD_KEY);
          if (memData) {
            this.leaderboard = JSON.parse(memData);
          }
          return;
        }

        const stored = localStorage.getItem(LEADERBOARD_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate structure
          if (Array.isArray(parsed)) {
            this.leaderboard = parsed.filter(entry =>
              entry &&
              typeof entry.username === 'string' &&
              typeof entry.time_ms === 'number' &&
              typeof entry.wet === 'boolean'
            );
          }
        }
      },
      undefined
    );
  }

  private saveLeaderboard(): void {
    ErrorHandler.withErrorHandlingSync(
      'LeaderboardService',
      'saveLeaderboard',
      () => {
        const data = JSON.stringify(this.leaderboard);

        if (this.useMemoryStorage) {
          MemoryStorage.setItem(LEADERBOARD_KEY, data);
        } else {
          const success = ErrorHandler.setLocalStorage(LEADERBOARD_KEY, data);
          if (!success) {
            // Fallback to memory storage
            console.warn('Falling back to memory storage');
            this.useMemoryStorage = true;
            MemoryStorage.setItem(LEADERBOARD_KEY, data);
          }
        }
      },
      undefined
    );
  }

  /**
   * Save leaderboard with retry logic and exponential backoff
   * Useful for Firebase saves that may hit quota limits
   */
  async saveLeaderboardWithRetry(retries: number = 3): Promise<boolean> {
    let attempt = 0;
    let delay = 1000; // Start with 1 second delay

    while (attempt < retries) {
      try {
        this.saveLeaderboard();
        return true;
      } catch (error) {
        attempt++;
        ErrorHandler.logError({
          component: 'LeaderboardService',
          action: 'saveLeaderboardWithRetry',
          error: error instanceof Error ? error : new Error(String(error)),
          metadata: { attempt, maxRetries: retries, nextDelay: delay },
        });

        if (attempt < retries) {
          // Wait with exponential backoff before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Double the delay for next attempt
        }
      }
    }

    // All retries failed - fall back to memory storage
    console.warn('All save retries failed, using memory storage');
    this.useMemoryStorage = true;
    try {
      MemoryStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.leaderboard));
      return true;
    } catch {
      return false;
    }
  }

  addEntry(entry: LeaderboardEntry): number {
    this.leaderboard.push(entry);

    // Sort by time (ascending - faster is better)
    // Wet runs go to bottom
    this.leaderboard.sort((a, b) => {
      if (a.wet && !b.wet) return 1;
      if (!a.wet && b.wet) return -1;
      return a.time_ms - b.time_ms;
    });

    // Keep only top MAX_ENTRIES
    if (this.leaderboard.length > MAX_ENTRIES) {
      this.leaderboard = this.leaderboard.slice(0, MAX_ENTRIES);
    }

    this.saveLeaderboard();

    // Return rank (1-indexed)
    const rank = this.leaderboard.findIndex(e =>
      e.username === entry.username &&
      e.time_ms === entry.time_ms &&
      e.timestamp === entry.timestamp
    ) + 1;

    return rank;
  }

  getLeaderboard(): LeaderboardEntry[] {
    return [...this.leaderboard];
  }

  getTopEntries(count: number = 10): LeaderboardEntry[] {
    return this.leaderboard.slice(0, count);
  }

  isTopScore(timeMs: number, wet: boolean): boolean {
    if (this.leaderboard.length < MAX_ENTRIES) return true;

    // If wet, check against other wet times
    if (wet) {
      const wetTimes = this.leaderboard.filter(e => e.wet);
      if (wetTimes.length === 0) return true;
      return timeMs < wetTimes[wetTimes.length - 1].time_ms;
    }

    // If not wet, check against all dry times
    const dryTimes = this.leaderboard.filter(e => !e.wet);
    if (dryTimes.length < MAX_ENTRIES) return true;
    return timeMs < dryTimes[dryTimes.length - 1].time_ms;
  }

  getRank(timeMs: number, wet: boolean): number {
    let rank = 1;
    for (const entry of this.leaderboard) {
      if (wet && !entry.wet) continue;
      if (!wet && entry.wet) break;
      if (entry.time_ms < timeMs) rank++;
      else break;
    }
    return rank;
  }

  clearLeaderboard(): void {
    this.leaderboard = [];
    this.saveLeaderboard();
  }
}

export const LeaderboardService = new LeaderboardServiceClass();
