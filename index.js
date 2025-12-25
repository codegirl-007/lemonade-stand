/**
 * @fileoverview Main application orchestrator.
 * Initializes game state, wires up UI events, and coordinates modules.
 */

import { init_game, set_price_per_cup, calculate_supply_cost, calculate_cost_per_cup, make_lemonade, set_weather, calculate_maximum_cups_available } from './game.js';
import { sprites, cups, render, whenSpritesReady, setActiveCustomer, getRandomCustomerKey } from './canvasController.js';
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

/**
 * Fades a customer in or out using requestAnimationFrame.
 * @param {string} spriteKey - Customer sprite key
 * @param {number} posIndex - Position index (0=left, 1=right)
 * @param {number} fromAlpha - Starting alpha
 * @param {number} toAlpha - Ending alpha
 * @param {number} duration - Duration in ms
 * @param {Function} onComplete - Callback when complete
 */
function fadeCustomer(spriteKey, posIndex, fromAlpha, toAlpha, duration, onComplete) {
  const startTime = performance.now();
  function step() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const alpha = fromAlpha + (toAlpha - fromAlpha) * progress;
    setActiveCustomer(spriteKey, posIndex, alpha);
    render();
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      onComplete();
    }
  }
  step();
}

function animateSales(attempts, onComplete) {
  let i = 0;
  let cupIndex = 0;
  let posIndex = 0;

  function nextAttempt() {
    if (i >= attempts.length) {
      setActiveCustomer(null, 0, 0);
      sprites.maker.frameIndex = 0;
      render();
      onComplete();
      return;
    }

    // Pick random customer, alternate position
    const customerKey = getRandomCustomerKey();
    posIndex = (posIndex + 1) % 2;

    // Fade in customer
    fadeCustomer(customerKey, posIndex, 0, 1, 500, () => {
      if (attempts[i]) {
        // Buy: maker active, empty cup, wait, refill, maker idle, fade out
        sprites.maker.frameIndex = 1;
        cups[cupIndex].empty();
        render();
        setTimeout(() => {
          sprites.maker.frameIndex = 0;
          cups[cupIndex].fill();
          render();
          cupIndex = (cupIndex + 1) % cups.length;
          // Fade out customer
          fadeCustomer(customerKey, posIndex, 1, 0, 500, () => {
            i++;
            nextAttempt();
          });
        }, 600);
      } else {
        // Pass: brief pause then fade out
        setTimeout(() => {
          fadeCustomer(customerKey, posIndex, 1, 0, 500, () => {
            i++;
            nextAttempt();
          });
        }, 500);
      }
    });
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

const priceInlineInput = document.querySelector('.price_inline_input');
const startDayBtn = document.querySelector('.start_day_btn');

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

// Inline price editing
if (priceInlineInput) {
  // Save price on blur or Enter
  function savePrice() {
    const value = parseFloat(priceInlineInput.value) || 0;
    const newState = set_price_per_cup(gameState, value);
    setState(newState);
    priceInlineInput.value = gameState.price_per_cup.toFixed(2);
  }

  priceInlineInput.addEventListener('blur', savePrice);
  priceInlineInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      priceInlineInput.blur();
    }
  });

  // Select all text on focus for easy editing
  priceInlineInput.addEventListener('focus', () => {
    priceInlineInput.select();
  });

  // Initialize with current value
  priceInlineInput.value = gameState.price_per_cup.toFixed(2);
}

// Start Day button
if (startDayBtn) {
  startDayBtn.addEventListener('click', startDay);
}

// Recipe stepper buttons
document.querySelectorAll('.stepper_btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const ingredient = btn.dataset.ingredient;
    const isPlus = btn.classList.contains('stepper_plus');
    const currentValue = gameState.recipe[ingredient];
    const newValue = isPlus ? currentValue + 1 : Math.max(0, currentValue - 1);
    
    const newRecipe = { ...gameState.recipe, [ingredient]: newValue };
    const result = calculate_cost_per_cup(gameState, newRecipe);
    setState({
      recipe: newRecipe,
      cost_per_cup: result.cost_per_cup
    });
  });
});

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
