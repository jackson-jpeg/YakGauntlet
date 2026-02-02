/**
 * Accessibility utilities for screen reader support
 */

const LIVE_REGION_ID = 'yak-gauntlet-announcer';

/**
 * Initialize the ARIA live region for screen reader announcements
 * Should be called once when the app starts
 */
export function initAriaLiveRegion(): void {
  // Check if already exists
  if (document.getElementById(LIVE_REGION_ID)) {
    return;
  }

  const liveRegion = document.createElement('div');
  liveRegion.id = LIVE_REGION_ID;
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.setAttribute('role', 'status');

  // Visually hidden but accessible to screen readers
  Object.assign(liveRegion.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });

  document.body.appendChild(liveRegion);
}

/**
 * Announce a message to screen readers
 * @param message - The message to announce
 * @param priority - 'polite' waits for user idle, 'assertive' interrupts immediately
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const liveRegion = document.getElementById(LIVE_REGION_ID);

  if (!liveRegion) {
    console.warn('ARIA live region not initialized. Call initAriaLiveRegion() first.');
    return;
  }

  // Update priority if needed
  liveRegion.setAttribute('aria-live', priority);

  // Clear and set new message (clearing first ensures re-announcement of same text)
  liveRegion.textContent = '';

  // Small delay to ensure the clear is processed
  requestAnimationFrame(() => {
    liveRegion.textContent = message;
  });
}

/**
 * Announce game events with appropriate messages
 */
export const GameAnnouncements = {
  gameStart: () => announceToScreenReader('Game started. Good luck!'),
  stationComplete: (station: string, success: boolean) =>
    announceToScreenReader(
      success ? `${station} completed successfully!` : `${station} missed.`
    ),
  gameOver: (time: string, wet: boolean) =>
    announceToScreenReader(
      `Game over! Your time: ${time}. ${wet ? 'Wet run - penalties applied.' : 'Clean run!'}`
    ),
  newHighScore: (rank: number) =>
    announceToScreenReader(`New high score! You ranked number ${rank} on the leaderboard!`, 'assertive'),
  buttonFocused: (label: string) =>
    announceToScreenReader(`${label} button`),
};
