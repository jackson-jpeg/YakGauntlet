import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { initAriaLiveRegion } from './utils/Accessibility';

// Initialize accessibility features
initAriaLiveRegion();

// Initialize Phaser game
const game = new Phaser.Game(gameConfig);

// Handle window resize
window.addEventListener('resize', () => {
  game.scale.refresh();
});

// Prevent context menu on right-click (for desktop)
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Log game version
console.log('The Yak Gauntlet v0.1.0 - Phase 1');
