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

// DYNAMIC RESOLUTION
// We grab the actual window size so BootScene uses the full screen initially.
// (Note: On resize events, scenes should use this.scale.width/height)
export const GAME_WIDTH = window.innerWidth;
export const GAME_HEIGHT = window.innerHeight;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  // Use 100% to fill the container exactly without calculating pixels
  width: '100%',
  height: '100%',
  backgroundColor: '#1a1a1a', // Dark studio grey
  scale: {
    // RESIZE mode allows the game to fill the window
    mode: Phaser.Scale.RESIZE,
    // NO_CENTER because we are filling the whole screen
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 1.5 }, // Heavier gravity for better "flick" feel
      debug: false,
      runner: {
        fps: 60 // Fixed timestep for consistent physics
      }
    },
  },
  // Scene list (BootScene first to load assets)
  scene: [
    BootScene, 
    RunScene, 
    GoalieScene, 
    WiffleScene, 
    FootballScene, 
    Corner3RightScene, 
    Corner3LeftScene, 
    QuizScene, 
    ResultScene
  ],
  input: {
    activePointers: 2, // Multi-touch support
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
  dom: {
    createContainer: true // Required for Quiz DOM overlay
  },
  // CRITICAL FIX: Forcefully clean up CSS to prevent scrollbars/overflow
  callbacks: {
    preBoot: () => {
      const doc = document.documentElement;
      const body = document.body;
      
      // Remove default margins
      body.style.margin = '0';
      body.style.padding = '0';
      
      // Hide scrollbars
      body.style.overflow = 'hidden';
      
      // Ensure height is 100%
      doc.style.height = '100%';
      body.style.height = '100%';
    }
  }
};