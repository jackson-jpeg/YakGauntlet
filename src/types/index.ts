// Game state types
export interface RunState {
  runId: string;
  startTimeMs: number;
  endTimeMs: number | null;
  currentStationId: StationId;
  missCountByStation: Record<StationId, number>;
  wet: boolean;
  goalieCharacterId: CharacterId;
}

export type StationId =
  | 'cornhole'
  | 'goalie'
  | 'wiffle'
  | 'football'
  | 'corner3_right'
  | 'corner3_left';

export type CharacterId =
  | 'BIG_CAT'
  | 'BRANDON_WALKER'
  | 'KB'
  | 'NICK_TURANI'
  | 'KATE'
  | 'ZAH'
  | 'STEVEN_CHEAH'
  | 'DANNY_CONRAD'
  | 'MARK_TITUS'
  | 'TJ';

// Station interface - all stations implement this
export interface Station {
  id: StationId;
  name: string;
  spawnPoint: { x: number; y: number };
  cameraAnchor: { x: number; y: number };
  bounds: Phaser.Geom.Rectangle;

  init(): void;
  spawn(): void;
  reset(): void;
  checkSuccess(): boolean;
  destroy(): void;
}

// Flick input tracking
export interface FlickData {
  startX: number;
  startY: number;
  startTime: number;
  endX: number;
  endY: number;
  endTime: number;
}

// Leaderboard entry
export interface LeaderboardEntry {
  username: string;
  time_ms: number;
  wet: boolean;
  timestamp: number;
  device: 'mobile' | 'desktop';
  goalie: CharacterId;
  version: string;
}

// Character modifiers for goalie
export interface CharacterModifiers {
  goalieSpeedMultiplier: number;
  goalieWidthMultiplier: number;
  goalieReactionDelayMs: number;
  tauntFrequency: number;
}

export const CHARACTER_MODIFIERS: Record<CharacterId, CharacterModifiers> = {
  BIG_CAT: {
    goalieSpeedMultiplier: 1.1,
    goalieWidthMultiplier: 1.0,
    goalieReactionDelayMs: 50,
    tauntFrequency: 0.3,
  },
  BRANDON_WALKER: {
    goalieSpeedMultiplier: 0.9,
    goalieWidthMultiplier: 1.1,
    goalieReactionDelayMs: 80,
    tauntFrequency: 0.5,
  },
  KB: {
    goalieSpeedMultiplier: 1.2,
    goalieWidthMultiplier: 0.9,
    goalieReactionDelayMs: 30,
    tauntFrequency: 0.4,
  },
  NICK_TURANI: {
    goalieSpeedMultiplier: 1.0,
    goalieWidthMultiplier: 1.0,
    goalieReactionDelayMs: 60,
    tauntFrequency: 0.6,
  },
  KATE: {
    goalieSpeedMultiplier: 1.15,
    goalieWidthMultiplier: 0.85,
    goalieReactionDelayMs: 40,
    tauntFrequency: 0.3,
  },
  ZAH: {
    goalieSpeedMultiplier: 0.95,
    goalieWidthMultiplier: 1.05,
    goalieReactionDelayMs: 70,
    tauntFrequency: 0.4,
  },
  STEVEN_CHEAH: {
    goalieSpeedMultiplier: 1.0,
    goalieWidthMultiplier: 1.0,
    goalieReactionDelayMs: 100,
    tauntFrequency: 0.2,
  },
  DANNY_CONRAD: {
    goalieSpeedMultiplier: 1.05,
    goalieWidthMultiplier: 0.95,
    goalieReactionDelayMs: 55,
    tauntFrequency: 0.35,
  },
  MARK_TITUS: {
    goalieSpeedMultiplier: 1.1,
    goalieWidthMultiplier: 1.0,
    goalieReactionDelayMs: 45,
    tauntFrequency: 0.4,
  },
  TJ: {
    goalieSpeedMultiplier: 0.9,
    goalieWidthMultiplier: 1.1,
    goalieReactionDelayMs: 90,
    tauntFrequency: 0.5,
  },
};
