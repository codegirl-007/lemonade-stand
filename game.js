/**
 * Enum representing possible weather conditions in the game.
 * @readonly
 * @enum {string}
 */
export const Weather = Object.freeze({
  COLD: 'cold',
  CLOUDY: 'cloudy',
  SUNNY: 'sunny',
  HOT: 'hot'
});

/**
 * Enum representing game duration options.
 * Provides both numeric values and reverse lookups.
 * @readonly
 * @enum {number|string}
 */
export const Days = Object.freeze({
  7: 7,
  14: 14,
  30: 30
});

/**
 * Multiplier applied to base demand based on weather conditions.
 * Higher values mean more customers.
 * @type {Object.<string, number>}
 */
const WeatherFactor = {
  cold: 0.5,
  cloudy: 0.8,
  sunny: 1.0,
  hot: 1.4
}

/**
 * The ideal price per cup for each weather condition.
 * Pricing closer to these values yields better sales.
 * @type {Object.<string, number>}
 */
const IdealPrice = {
  cold: 0.20,
  cloudy: 0.30,
  sunny: 0.35,
  hot: 0.50
}

/**
 * The ideal recipe (ingredient ratios) for each weather condition.
 * Using these ratios produces the best taste score.
 * @type {Object.<string, {lemons: number, sugar: number, ice: number}>}
 */
const IdealRecipe = {
  cold: {
    lemons: 1,
    sugar: 2,
    ice: 1
  },
  cloudy: {
    lemons: 1,
    sugar: 1,
    ice: 2
  },
  sunny: {
    lemons: 1,
    sugar: 1,
    ice: 3
  },
  hot: {
    lemons: 1,
    sugar: 1,
    ice: 4
  }
}

/**
 * Tiered pricing structure for supplies.
 * Price per unit decreases with larger quantities.
 * @type {Object.<string, Array.<{min: number, max: number, price: number}>>}
 */
const SupplyPricing = {
  lemons: [
    { min: 1, max: 50, price: 0.02 },
    { min: 51, max: 100, price: 0.018 },
    { min: 101, max: Infinity, price: 0.015 }
  ],
  sugar: [
    { min: 1, max: 50, price: 0.01 },
    { min: 51, max: 100, price: 0.009 },
    { min: 101, max: Infinity, price: 0.008 }
  ],
  ice: [
    { min: 1, max: 100, price: 0.01 },
    { min: 101, max: 300, price: 0.009 },
    { min: 301, max: Infinity, price: 0.008 }
  ],
  cups: [
    { min: 1, max: 100, price: 0.01 },
    { min: 101, max: Infinity, price: 0.009 }
  ]
};

/**
 * Calculate the cost of purchasing a supply item based on tiered pricing.
 * @param {string} item - The supply type (lemons, sugar, ice, cups)
 * @param {number} quantity - The quantity to purchase
 * @returns {number} The total cost
 */
export function calculate_supply_cost(item, quantity) {
  if (quantity <= 0) return 0;
  const tiers = SupplyPricing[item];
  if (!tiers) return 0;
  const tier = tiers.find(t => quantity >= t.min && quantity <= t.max);
  return tier ? Math.round(quantity * tier.price * 100) / 100 : 0;
}

/**
 * Get the pricing tiers for a supply item.
 * @param {string} item - The supply type
 * @returns {Array.<{min: number, max: number, price: number}>} The pricing tiers
 */
export function get_supply_pricing(item) {
  return SupplyPricing[item] || [];
}

/**
 * Probability weights for each weather type.
 * Used to randomly determine the day's weather.
 * @type {Array.<{type: string, weight: number}>
 */
const WeatherChance = [
  { type: Weather.CLOUDY, weight: 40 },
  { type: Weather.SUNNY, weight: 35 },
  { type: Weather.HOT, weight: 15 },
  { type: Weather.COLD, weight: 10 }
]

/**
 * @typedef {Object} Recipe
 * @property {number} lemons
 * @property {number} sugar
 * @property {number} ice
 */

/**
 * @typedef {Object} Supplies
 * @property {number} lemons
 * @property {number} sugar
 * @property {number} ice
 * @property {number} cups
 */

/**
 * @typedef {Object.<number, number>} PriceTable
 */

/**
 * @typedef {Object} GameState
 * @property {number} player_money
 * @property {Recipe} recipe
 * @property {Supplies} supplies
 * @property {string} weather
 * @property {number} price_per_cup
 * @property {number} days
 * @property {{
 *   lemons: PriceTable,
 *   sugar: PriceTable,
 *   ice: PriceTable,
 *   cups: PriceTable
 * }} supplies_prices
 * @property {number} cups_sold
 */

/**
 * Initialize a new game state with default values.
 * Sets up empty recipe, zero supplies, default weather, and pricing tables.
 *
 * @returns {GameState} A fresh game state ready to begin.
 */
export function init_game() {
  return {
    player_money: 25.00,
    recipe: {
      lemons: 0,
      sugar: 0,
      ice: 0
    },
    supplies: {
      lemons: 0,
      sugar: 0,
      ice: 0,
      cups: 0
    },
    weather: Weather.SUNNY,
    price_per_cup: 1.00,
    days: Days[7],
    supplies_prices: {
      lemons: {
        12: 4.80,
        24: 7.20,
        48: 9.60
      },
      sugar: {
        12: 4.80,
        20: 7.00,
        50: 15.00
      },
      ice: {
        50: 1.00,
        200: 3.00,
        500: 5.00
      },
      cups: {
        75: 1.00,
        225: 2.35,
        400: 3.75
      }
    },
    cups_sold: 0
  }
}

/**
 * Set a new recipe for making lemonade.
 * Defines the ratio of ingredients per cup.
 *
 * @param {GameState} game_state - The current game state.
 * @param {number} lemons - The number of lemons per cup.
 * @param {number} sugar - The amount of sugar per cup.
 * @param {number} ice - The amount of ice per cup.
 * @returns {GameState} A new game state with the updated recipe.
 */
export function set_recipe(game_state, lemons, sugar, ice) {
  console.assert(game_state, 'game_state must be defined');
  console.assert(typeof lemons == 'number', 'lemons must be a number');
  console.assert(typeof sugar == 'number', 'sugar must be a number');
  console.assert(typeof ice == 'number', 'ice must be a number');

  return {
    ...game_state,
    recipe: {
      ...game_state.recipe,
      lemons,
      sugar,
      ice
    }
  };
}

/**
 * Determine the day's weather randomly based on weighted probabilities.
 * Uses WeatherChance to select a weather type.
 *
 * @param {GameState} game_state - The current state of the game.
 * @returns {GameState} A new game state with the updated weather.
 */
export function set_weather(game_state) {
  const totalWeight = WeatherChance.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const w of WeatherChance) {
    if (roll < w.weight) {
      return {
        ...game_state,
        weather: w.type
      }
    }

    roll -= w.weight
  }
}

/**
 * Set the number of days the game will play through.
 * Valid options are 7 (week), 14 (two weeks), or 30 (month).
 *
 * @param {GameState} game_state - The current state of the game.
 * @param {number} days - The number of days (7, 14, or 30).
 * @returns {GameState} A new game state with the updated number of days.
 */
export function set_days(game_state, days) {
  console.assert(game_state, 'game_state must be defined');
  console.assert(typeof days === 'number', 'days must be a number');
  console.assert(Object.values(Days).includes(days), 'invalid days value');

  return {
    ...game_state,
    days: days
  }
}

/**
 * Set the price per cup of lemonade.
 * Rounds the cost to two decimal places.
 *
 * @param {GameState} game_state - The current game state.
 * @param {number} cost - The price to charge per cup.
 * @returns {GameState} A new game state with the updated cost per cup.
 */
export function set_price_per_cup(game_state, cost) {
  console.assert(typeof cost === 'number', 'cost must be a number');
  console.assert(game_state, 'game_state must be defined');
  return {
    ...game_state,
    price_per_cup: Math.round(parseFloat(cost) * 100) / 100
  }
}

/**
 * Calculate the number of cups sold based on pricing, weather, and taste.
 * Demand is influenced by weather conditions, price sensitivity, and a random factor.
 *
 * @param {number} price_per_cup - The price charged per cup.
 * @param {number} cups_in_supplies - The number of cups available to sell.
 * @param {string} weather - The current weather condition (from Weather enum).
 * @param {number} [tasteScore=1] - The taste quality score (0.5 to 1.2).
 * @returns {number} The number of cups sold (capped by available supplies).
 */
export function calculate_cups_sold(price_per_cup, cups_in_supplies, weather, tasteScore = 1) {
  const base_demand = 30;
  const weather_factor = WeatherFactor[weather] || 1.0;
  const ideal_price = IdealPrice[weather] || 0.35

  const sensitivity = 1.5;
  let price_effect = 1 - (price_per_cup - ideal_price) * sensitivity;
  if (price_effect < 0) {
    price_effect = 0;
  }

  let demand = base_demand * weather_factor * price_effect * tasteScore;
  demand *= 0.9 + Math.random() * 0.2;

  const cupsSold = Math.min(Math.floor(demand), cups_in_supplies);

  return cupsSold;
}

/**
 * Calculate a taste score based on how close the recipe is to ideal values.
 * Score ranges from 0.5 (poor) to 1.2 (excellent).
 *
 * @param {number} lemons_per_cup - The number of lemons used per cup.
 * @param {number} sugar_per_cup - The amount of sugar used per cup.
 * @param {number} [ideal_lemons=1] - The ideal number of lemons per cup.
 * @param {number} [ideal_sugar=1] - The ideal amount of sugar per cup.
 * @returns {number} A taste score between 0.5 and 1.2.
 */
export function calculate_taste_score(lemons_per_cup, sugar_per_cup, ideal_lemons = 1, ideal_sugar = 1) {
  const lemon_diff = Math.abs(lemons_per_cup - ideal_lemons);
  const sugar_diff = Math.abs(sugar_per_cup - ideal_sugar);

  let score = 1.0;

  if (lemon_diff === 0 && sugar_diff === 0) {
    score += 0.2; // perfect recipe bonus
  } else {
    score -= (lemon_diff * 0.3 + sugar_diff * 0.2);
  }

  if (score < 0.5) score = 0.5;
  if (score > 1.2) score = 1.2;

  return score;
}

/**
 * Execute lemonade production and sales for the day.
 * Calculates cups that can be made from available supplies,
 * determines sales, updates inventory, and calculates profit.
 *
 * @param {GameState} game_state - The current game state.
 * @returns {GameState} A new game state with updated money, supplies, and cups sold.
 */
export function make_lemonade(game_state) {
  console.assert(game_state, 'game_state must be defined');

  const recipe = game_state.recipe;
  const weather = game_state.weather;
  const price = game_state.price_per_cup;

  const ideal = IdealRecipe[weather];
  const tasteScore = calculate_taste_score(
    recipe.lemons,
    recipe.sugar,
    ideal.lemons,
    ideal.sugar
  );

  const cups_available = Math.min(
    recipe.lemons > 0 ? game_state.supplies.lemons / recipe.lemons : 0,
    recipe.sugar > 0 ? game_state.supplies.sugar / recipe.sugar : 0,
    recipe.ice > 0 ? game_state.supplies.ice / recipe.ice : 0,
    game_state.supplies.cups
  );

  const cups_sold = calculate_cups_sold(price, cups_available, weather, tasteScore);

  const remaining_supplies = {
    lemons: game_state.supplies.lemons - recipe.lemons * cups_sold,
    sugar: game_state.supplies.sugar - recipe.sugar * cups_sold,
    ice: game_state.supplies.ice - recipe.ice * cups_sold,
    cups: game_state.supplies.cups - cups_sold
  }

  const profit = price * cups_sold;

  return {
    ...game_state,
    player_money: game_state.player_money + profit,
    supplies: remaining_supplies,
    cups_sold
  }
}
