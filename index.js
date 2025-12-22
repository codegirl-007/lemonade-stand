/**
 * @fileoverview Main application orchestrator.
 * Initializes game state, wires up UI events, and coordinates modules.
 */

import { init_game } from './game.js';
import { sprites, cups, render, whenSpritesReady } from './canvasController.js';
import { createReactiveState, updateBindings } from './binding.js';

// Initialize game state
let gameState = createReactiveState(init_game());
updateBindings(gameState);

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
const goShoppingBtn = document.querySelector('.go_shopping_btn');
const shoppingModal = document.querySelector('.shopping_modal');
const shoppingModalClose = document.querySelector('.shopping_modal_close');

// Event handlers
if (goShoppingBtn) {
  goShoppingBtn.addEventListener('click', () => {
    console.log('hey');
    shoppingModal.classList.add('open');
  });

  shoppingModalClose.addEventListener('click', () => {
    shoppingModal.classList.remove('open')
  })
}

// Export for debugging in console
window.gameState = gameState;
window.sprites = sprites;
window.cups = cups;
