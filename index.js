/**
 * @fileoverview Main application orchestrator.
 * Initializes game state, wires up UI events, and coordinates modules.
 */

import { init_game, set_price_per_cup, calculate_supply_cost, calculate_cost_per_cup, make_lemonade, set_weather, calculate_maximum_cups_available } from './game.js';
import { sprites, cups, render, whenSpritesReady } from './canvasController.js';
import { createReactiveState, updateBindings } from './binding.js';

// Initialize game state
let gameState = createReactiveState(init_game());
updateBindings(gameState);

// Weather icon element
const weatherIcon = document.querySelector('.weather_icon');

function updateWeatherIcon() {
  if (weatherIcon) {
    weatherIcon.src = `${gameState.weather}.png`;
    weatherIcon.alt = gameState.weather;
  }
}

updateWeatherIcon();

let isAnimating = false;

function generateSalesAttempts(maxCups, cupsSold) {
  const attempts = Array(maxCups).fill(false);
  for (let i = 0; i < cupsSold; i++) attempts[i] = true;
  // Fisher-Yates shuffle
  for (let i = attempts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [attempts[i], attempts[j]] = [attempts[j], attempts[i]];
  }
  return attempts;
}

function animateSales(attempts, onComplete) {
  let i = 0;
  let cupIndex = 0;

  function nextAttempt() {
    if (i >= attempts.length) {
      sprites.maker.frameIndex = 0; // Maker idle
      render();
      onComplete();
      return;
    }

    if (attempts[i]) {
      // Buy: maker active, empty cup, wait, refill, maker idle
      sprites.maker.frameIndex = 1;
      cups[cupIndex].empty();
      render();
      setTimeout(() => {
        sprites.maker.frameIndex = 0;
        cups[cupIndex].fill();
        render();
        cupIndex = (cupIndex + 1) % cups.length;
        i++;
        nextAttempt();
      }, 400);
    } else {
      // Pass: skip instantly
      i++;
      nextAttempt();
    }
  }

  nextAttempt();
}

function fillAllCups() {
  cups.forEach(cup => cup.fill());
  render();
}

function resetCups() {
  cups.forEach(cup => cup.empty());
  render();
}

// Wait for all sprites to load, then render once
whenSpritesReady(() => {
  render();
  resetCups(); // Start with empty cups
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

const changeRecipeBtn = document.querySelector('.change_recipe_btn');
const recipeModal = document.querySelector('.recipe_modal');
const recipeModalClose = document.querySelector('.recipe_modal_close');

const startDayBtn = document.querySelector('.start_day_btn');
const recipeSaveBtn = document.querySelector('.recipe_save_btn');

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

// Recipe modal handlers
const recipeInputs = document.querySelectorAll('.recipe_input');
const recipeCostValue = document.querySelector('.recipe_cost_value');

// Base prices for cost breakdown (matches SupplyPricing tier 1 in game.js)
const basePrices = { lemons: 0.02, sugar: 0.01, ice: 0.01, cup: 0.01 };

function updateRecipeCost() {
  const lemons = parseInt(document.querySelector('.recipe_input[data-recipe="lemons"]').value) || 0;
  const sugar = parseInt(document.querySelector('.recipe_input[data-recipe="sugar"]').value) || 0;
  const ice = parseInt(document.querySelector('.recipe_input[data-recipe="ice"]').value) || 0;

  // Update breakdown rows
  document.querySelector('.recipe_cost_item[data-cost="lemons"]').textContent = '$' + (lemons * basePrices.lemons).toFixed(2);
  document.querySelector('.recipe_cost_item[data-cost="sugar"]').textContent = '$' + (sugar * basePrices.sugar).toFixed(2);
  document.querySelector('.recipe_cost_item[data-cost="ice"]').textContent = '$' + (ice * basePrices.ice).toFixed(2);
  document.querySelector('.recipe_cost_item[data-cost="cup"]').textContent = '$' + basePrices.cup.toFixed(2);

  // Update total
  const result = calculate_cost_per_cup(gameState, { lemons, sugar, ice });
  recipeCostValue.textContent = '$' + result.cost_per_cup.toFixed(2);
}

// Update cost when recipe inputs change
recipeInputs.forEach(input => {
  input.addEventListener('input', updateRecipeCost);
});

if (changeRecipeBtn) {
  changeRecipeBtn.addEventListener('click', () => {
    // Set inputs to current recipe values
    document.querySelector('.recipe_input[data-recipe="lemons"]').value = gameState.recipe.lemons;
    document.querySelector('.recipe_input[data-recipe="sugar"]').value = gameState.recipe.sugar;
    document.querySelector('.recipe_input[data-recipe="ice"]').value = gameState.recipe.ice;
    updateRecipeCost();
    recipeModal.classList.add('open');
  });

  recipeModalClose.addEventListener('click', () => {
    recipeModal.classList.remove('open');
  });

  recipeSaveBtn.addEventListener('click', () => {
    const lemons = parseInt(document.querySelector('.recipe_input[data-recipe="lemons"]').value) || 0;
    const sugar = parseInt(document.querySelector('.recipe_input[data-recipe="sugar"]').value) || 0;
    const ice = parseInt(document.querySelector('.recipe_input[data-recipe="ice"]').value) || 0;

    const result = calculate_cost_per_cup(gameState, { lemons, sugar, ice });
    setState({
      recipe: { lemons, sugar, ice },
      cost_per_cup: result.cost_per_cup
    });
    recipeModal.classList.remove('open');
  });
}

// Start Day button
if (startDayBtn) {
  startDayBtn.addEventListener('click', startDay);
}

// Export for debugging in console
window.gameState = gameState;
window.sprites = sprites;
window.cups = cups;

function setState(newState) {
  Object.assign(gameState, newState);
  if (newState.weather) {
    updateWeatherIcon();
  }
}

function startDay() {
  if (gameState.supplies.cups <= 0) {
    alert('You need cups to sell lemonade!');
    return;
  }

  const { recipe } = gameState;
  if (recipe.lemons <= 0) {
    alert('Your recipe needs lemons!');
    return;
  }

  if (isAnimating) return;
  isAnimating = true;
  startDayBtn.disabled = true;

  // Fill all cups at start
  fillAllCups();

  const maxCups = calculate_maximum_cups_available(gameState.supplies, gameState.recipe);
  const result = make_lemonade(gameState);
  const cupsSold = result.cups_sold;

  const attempts = generateSalesAttempts(maxCups, cupsSold);

  animateSales(attempts, () => {
    setState(result);

    // Randomize weather for next day
    const newWeatherState = set_weather(gameState);
    setState({ weather: newWeatherState.weather });

    isAnimating = false;
    startDayBtn.disabled = false;
  });
}
