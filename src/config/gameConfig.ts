import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { RunScene } from '../scenes/RunScene';
import { GoalieScene } from '../scenes/GoalieScene';
import { WiffleScene } from '../scenes/WiffleScene';
import { FootballScene } from '../scenes/FootballScene';
import { Corner3RightScene } from '../scenes/Corner3RightScene';
import { Corner3LeftScene } from '../scenes/Corner3LeftScene';
import { QuizScene } from '../scenes/QuizScene';
import { ResultScene } from '../scenes/ResultScene';

// Base design resolution (9:16 aspect ratio)
// This is our reference resolution - actual game scales to fit any screen
export const GAME_WIDTH = 540;
export const GAME_HEIGHT = 960;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0f1419',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 1 },
      debug: false,
    },
  },
  scene: [BootScene, RunScene, GoalieScene, WiffleScene, FootballScene, Corner3RightScene, Corner3LeftScene, QuizScene, ResultScene],
  input: {
    activePointers: 1,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
};
