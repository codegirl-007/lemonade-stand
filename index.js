/**
 * @fileoverview Main application orchestrator.
 * Initializes game state, wires up UI events, and coordinates modules.
 */

import { init_game, set_price_per_cup, calculate_supply_cost } from './game.js';
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

// Shopping modal - quantity inputs and dynamic pricing
const shopQtyInputs = document.querySelectorAll('.shop_qty_input');
const shopBuyBtns = document.querySelectorAll('.shop_item_btn');

function updateShopPrice(item) {
  const input = document.querySelector(`.shop_qty_input[data-item="${item}"]`);
  const priceDisplay = document.querySelector(`.shop_item_price[data-price="${item}"]`);
  const qty = parseInt(input.value) || 0;
  const cost = calculate_supply_cost(item, qty);
  priceDisplay.textContent = '$' + cost.toFixed(2);
}

// Update prices when quantity changes
shopQtyInputs.forEach(input => {
  input.addEventListener('input', () => {
    updateShopPrice(input.dataset.item);
  });
});

// Buy button handlers
shopBuyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.dataset.item;
    const input = document.querySelector(`.shop_qty_input[data-item="${item}"]`);
    const qty = parseInt(input.value) || 0;
    const cost = calculate_supply_cost(item, qty);
    
    if (cost > gameState.player_money) {
      alert("Not enough money!");
      return;
    }
    
    setState({
      player_money: gameState.player_money - cost,
      supplies: {
        ...gameState.supplies,
        [item]: gameState.supplies[item] + qty
      }
    });
  });
});

// Event handlers
if (goShoppingBtn) {
  goShoppingBtn.addEventListener('click', () => {
    // Update all prices when modal opens
    ['lemons', 'sugar', 'ice', 'cups'].forEach(updateShopPrice);
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
