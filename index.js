/**
 * @fileoverview Main application orchestrator.
 * Initializes game state, wires up UI events, and coordinates modules.
 */

import { init_game, set_price_per_cup } from './game.js';
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

const changePriceBtn = document.querySelector('.change_price_button');
const priceModal = document.querySelector('.price_change_modal');
const priceModalClose = document.querySelector('.price_change_modal_close');
const priceInput = document.querySelector('.price_input');

const priceSaveBtn = document.querySelector('.price_change_save_btn');

// Event handlers
if (goShoppingBtn) {
  goShoppingBtn.addEventListener('click', () => {
    console.log('hey');
    shoppingModal.classList.add('open');
  });

  shoppingModalClose.addEventListener('click', () => {
    shoppingModal.classList.remove('open');
  })
}

if (changePriceBtn) {
  changePriceBtn.addEventListener('click', () => {

    priceModal.classList.add('open');
    priceInput.focus();
    const priceInputLength = priceInput.value.length;

    priceInput.setSelectionRange(priceInputLength, priceInputLength);
  });

  priceModalClose.addEventListener('click', () => {
    priceModal.classList.remove('open');
  });

  priceSaveBtn.addEventListener('click', () => {
    const newState = set_price_per_cup(gameState, Number(priceInput.value));
    setState(newState);
    priceModal.classList.remove('open');
  })
}
// Export for debugging in console
window.gameState = gameState;
window.sprites = sprites;
window.cups = cups;

function setState(newState) {
  Object.assign(gameState, newState);
}
