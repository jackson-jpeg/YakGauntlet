import type { RunState, StationId, CharacterId } from '../types';
import { ErrorHandler } from '../utils/ErrorHandler';

const STATION_ORDER: StationId[] = [
  'cornhole',
  'goalie',
  'wiffle',
  'football',
  'corner3_right',
  'corner3_left',
];

const CHARACTERS: CharacterId[] = [
  'BIG_CAT',
  'BRANDON_WALKER',
  'KB',
  'NICK_TURANI',
  'KATE',
  'ZAH',
  'STEVEN_CHEAH',
  'DANNY_CONRAD',
  'MARK_TITUS',
  'TJ',
];

class GameStateServiceClass {
  private runState: RunState | null = null;

  initNewRun(): RunState {
    return ErrorHandler.withErrorHandlingSync(
      'GameStateService',
      'initNewRun',
      () => {
        const runId = crypto.randomUUID();

        // Seed random goalie selection based on runId
        const goalieIndex = this.hashStringToIndex(runId, CHARACTERS.length);

        this.runState = {
          runId,
          startTimeMs: 0, // Set when first station begins
          endTimeMs: null,
          currentStationId: STATION_ORDER[0],
          missCountByStation: {
            cornhole: 0,
            goalie: 0,
            wiffle: 0,
            football: 0,
            corner3_right: 0,
            corner3_left: 0,
          },
          wet: false,
          goalieCharacterId: CHARACTERS[goalieIndex],
        };

        return this.runState;
      },
      // Fallback: return a default state if initialization fails
      {
        runId: 'fallback-' + Date.now(),
        startTimeMs: 0,
        endTimeMs: null,
        currentStationId: STATION_ORDER[0],
        missCountByStation: {
          cornhole: 0,
          goalie: 0,
          wiffle: 0,
          football: 0,
          corner3_right: 0,
          corner3_left: 0,
        },
        wet: false,
        goalieCharacterId: CHARACTERS[0],
      }
    );
  }

  getState(): RunState | null {
    return this.runState;
  }

  startTimer(): void {
    if (this.runState && this.runState.startTimeMs === 0) {
      this.runState.startTimeMs = Date.now();
    }
  }

  stopTimer(): void {
    if (this.runState) {
      this.runState.endTimeMs = Date.now();
      this.runState.wet = this.getFinalTimeMs() > 75000;
    }
  }

  completeRun(): void {
    this.stopTimer();
  }

  getCurrentTimeMs(): number {
    if (!this.runState) return 0;
    if (this.runState.startTimeMs === 0) return 0;

    const endTime = this.runState.endTimeMs ?? Date.now();
    return endTime - this.runState.startTimeMs;
  }

  getFinalTimeMs(): number {
    if (!this.runState || !this.runState.endTimeMs) return 0;
    return this.runState.endTimeMs - this.runState.startTimeMs;
  }

  recordMiss(stationId: StationId): void {
    ErrorHandler.withErrorHandlingSync(
      'GameStateService',
      'recordMiss',
      () => {
        if (!this.runState) {
          throw new Error('No active run state');
        }
        if (!STATION_ORDER.includes(stationId)) {
          throw new Error(`Invalid station ID: ${stationId}`);
        }
        this.runState.missCountByStation[stationId]++;
      },
      undefined,
      { stationId }
    );
  }

  advanceToNextStation(): StationId | null {
    return ErrorHandler.withErrorHandlingSync(
      'GameStateService',
      'advanceToNextStation',
      () => {
        if (!this.runState) {
          throw new Error('No active run state');
        }

        const currentIndex = STATION_ORDER.indexOf(this.runState.currentStationId);
        if (currentIndex === -1) {
          throw new Error(`Invalid current station: ${this.runState.currentStationId}`);
        }

        if (currentIndex < STATION_ORDER.length - 1) {
          this.runState.currentStationId = STATION_ORDER[currentIndex + 1];
          return this.runState.currentStationId;
        }

        return null; // No more stations
      },
      null
    );
  }

  getCurrentStationIndex(): number {
    if (!this.runState) return 0;
    return STATION_ORDER.indexOf(this.runState.currentStationId);
  }

  getTotalStations(): number {
    return STATION_ORDER.length;
  }

  isWet(): boolean {
    return this.runState?.wet ?? false;
  }

  resetGame(): void {
    if (this.runState) {
      // Reset to first station
      this.runState.currentStationId = STATION_ORDER[0];
      // Reset timer
      this.runState.startTimeMs = 0;
      this.runState.endTimeMs = null;
      // Reset miss counts
      this.runState.missCountByStation = {
        cornhole: 0,
        goalie: 0,
        wiffle: 0,
        football: 0,
        corner3_right: 0,
        corner3_left: 0,
      };
      // Reset wet status
      this.runState.wet = false;
      // Generate new runId and goalie
      this.runState.runId = crypto.randomUUID();
      const goalieIndex = this.hashStringToIndex(this.runState.runId, CHARACTERS.length);
      this.runState.goalieCharacterId = CHARACTERS[goalieIndex];
    }
  }

  private hashStringToIndex(str: string, max: number): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % max;
  }
}

export const GameStateService = new GameStateServiceClass();
