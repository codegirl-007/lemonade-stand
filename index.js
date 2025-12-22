/**
 * @fileoverview Main application orchestrator.
 * Initializes game state, wires up UI events, and coordinates modules.
 */

import { init_game } from './game.js';
import { sprites, cups, render, whenSpritesReady } from './canvasController.js';

// Initialize game state
let gameState = init_game();

// Wait for all sprites to load, then render once
whenSpritesReady(() => {
  render();

  // Example: fill the first cup after 1 second
  setTimeout(() => {
    cups[0].fill();
    sprites.maker.frameIndex = 1;
    render();
  }, 1000);
});

// UI Elements
const goShoppingBtn = document.querySelector('.go-shopping-btn');

// Event handlers
if (goShoppingBtn) {
  goShoppingBtn.addEventListener('click', () => {
    console.log('Go shopping clicked!');
    // TODO: Open shopping modal/UI
  });
}

// Export for debugging in console
window.gameState = gameState;
window.sprites = sprites;
window.cups = cups;
