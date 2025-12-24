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
 * Game balance constants.
 */
const BASE_DEMAND = 30;
const PRICE_SENSITIVITY = 1.5;
const DEMAND_VARIANCE = 0.2;
const TASTE_SCORE_MIN = 0.5;
const TASTE_SCORE_MAX = 1.2;
const TASTE_PENALTY_LEMON = 0.3;
const TASTE_PENALTY_SUGAR = 0.2;
const PERFECT_RECIPE_BONUS = 0.2;
const STARTING_MONEY = 2.00;
const STARTING_PRICE = 1.00;

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
 * Valid supply item types.
 * @type {string[]}
 */
const SupplyTypes = ['lemons', 'sugar', 'ice', 'cups'];

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
  console.assert(item, 'item must be defined');
  console.assert(SupplyTypes.includes(item), 'item must be a valid supply type');
  console.assert(typeof quantity === 'number', 'quantity must be a number');
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
  console.assert(item, 'item must be defined');
  console.assert(SupplyTypes.includes(item), 'item must be a valid supply type');
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
 * @typedef {Object} GameState
 * @property {number} player_money
 * @property {Recipe} recipe
 * @property {Supplies} supplies
 * @property {string} weather
 * @property {number} price_per_cup
 * @property {number} cups_sold
 * @property {number} cost_per_cup
 * @property {number} current_day
 * @property {number} total_earnings
 */

/**
 * Initialize a new game state with default values.
 * Sets up empty recipe, zero supplies, default weather, and pricing tables.
 *
 * @returns {GameState} A fresh game state ready to begin.
 */
export function init_game() {
  return {
    player_money: STARTING_MONEY,
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
    price_per_cup: STARTING_PRICE,
    cups_sold: 0,
    cost_per_cup: 0,
    current_day: 1,
    total_earnings: 0
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
  console.assert(typeof lemons === 'number', 'lemons must be a number');
  console.assert(typeof sugar === 'number', 'sugar must be a number');
  console.assert(typeof ice === 'number', 'ice must be a number');
  console.assert(lemons >= 0, 'lemons must be non-negative');
  console.assert(sugar >= 0, 'sugar must be non-negative');
  console.assert(ice >= 0, 'ice must be non-negative');

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
 * @param {number} [random=Math.random()] - Random value between 0-1 for deterministic testing.
 * @returns {GameState} A new game state with the updated weather.
 */
export function set_weather(game_state, random = Math.random()) {
  console.assert(game_state, 'game_state must be defined');
  console.assert(typeof random === 'number', 'random must be a number');

  const totalWeight = WeatherChance.reduce((sum, w) => sum + w.weight, 0);
  let roll = random * totalWeight;

  for (const w of WeatherChance) {
    if (roll < w.weight) {
      return {
        ...game_state,
        weather: w.type
      }
    }

    roll -= w.weight
  }

  // Fallback (should never reach here if weights are correct)
  return {
    ...game_state,
    weather: Weather.SUNNY
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
  console.assert(game_state, 'game_state must be defined');
  console.assert(typeof cost === 'number', 'cost must be a number');
  console.assert(cost >= 0, 'cost must be non-negative');
  return {
    ...game_state,
    price_per_cup: Math.round(cost * 100) / 100
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
 * @param {number} [random=Math.random()] - Random value between 0-1 for deterministic testing.
 * @returns {number} The number of cups sold (capped by available supplies).
 */
export function calculate_cups_sold(price_per_cup, cups_in_supplies, weather, tasteScore = 1, random = Math.random()) {
  console.assert(typeof price_per_cup === 'number', 'price must be a number');
  console.assert(typeof cups_in_supplies === 'number', 'cups in supplies must be a number');
  console.assert(Object.values(Weather).includes(weather), 'invalid weather value');
  console.assert(typeof tasteScore === 'number', 'taste score must be a number');
  console.assert(typeof random === 'number', 'random must be a number');

  const weather_factor = WeatherFactor[weather] || 1.0;
  const ideal_price = IdealPrice[weather] || 0.35

  let price_effect = 1 - (price_per_cup - ideal_price) * PRICE_SENSITIVITY;
  if (price_effect < 0) {
    price_effect = 0;
  }

  let demand = BASE_DEMAND * weather_factor * price_effect * tasteScore;
  demand *= (1 - DEMAND_VARIANCE / 2) + random * DEMAND_VARIANCE;

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
  console.assert(typeof lemons_per_cup === 'number', 'lemons_per_cup must be a number');
  console.assert(typeof sugar_per_cup === 'number', 'sugar_per_cup must be a number');
  console.assert(typeof ideal_lemons === 'number', 'ideal_lemons must be a number');
  console.assert(typeof ideal_sugar === 'number', 'ideal_sugar must be a number');

  const lemon_diff = Math.abs(lemons_per_cup - ideal_lemons);
  const sugar_diff = Math.abs(sugar_per_cup - ideal_sugar);

  let score = 1.0;

  if (lemon_diff === 0 && sugar_diff === 0) {
    score += PERFECT_RECIPE_BONUS;
  } else {
    score -= (lemon_diff * TASTE_PENALTY_LEMON + sugar_diff * TASTE_PENALTY_SUGAR);
  }

  if (score < TASTE_SCORE_MIN) score = TASTE_SCORE_MIN;
  if (score > TASTE_SCORE_MAX) score = TASTE_SCORE_MAX;

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

  // Lemonade requires lemons - can't sell without them in the recipe
  if (recipe.lemons === 0) {
    return {
      ...game_state,
      cups_sold: 0
    };
  }

  const cups_available = Math.min(
    recipe.lemons > 0 ? game_state.supplies.lemons / recipe.lemons : Infinity,
    recipe.sugar > 0 ? game_state.supplies.sugar / recipe.sugar : Infinity,
    recipe.ice > 0 ? game_state.supplies.ice / recipe.ice : Infinity,
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
    cups_sold,
    total_earnings: game_state.total_earnings + profit
  }
}

/**
 * Calculate the cost to produce one cup of lemonade based on the recipe.
 * Uses the base tier pricing for each ingredient.
 * @param {Object} recipe - The recipe with lemons, sugar, ice amounts
 * @returns {number} The cost to make one cup
 */
export function calculate_cost_per_cup(game_state, recipe) {
  console.assert(game_state, 'game_state must be defined');
  console.assert(recipe, 'recipe must be defined');
  console.assert(typeof recipe.lemons === 'number', 'recipe.lemons must be a number');
  console.assert(typeof recipe.sugar === 'number', 'recipe.sugar must be a number');
  console.assert(typeof recipe.ice === 'number', 'recipe.ice must be a number');

  const basePrices = {
    lemons: SupplyPricing.lemons[0].price,
    sugar: SupplyPricing.sugar[0].price,
    ice: SupplyPricing.ice[0].price,
    cup: SupplyPricing.cups[0].price
  };

  const cost =
    (recipe.lemons * basePrices.lemons) +
    (recipe.sugar * basePrices.sugar) +
    (recipe.ice * basePrices.ice) +
    basePrices.cup;

  return {
    ...game_state,
    cost_per_cup: Math.round(cost * 100) / 100,
  }
}

/**
 * Calculate the maximum cups that can be produced from available supplies.
 * @param {Supplies} supplies - Available supplies
 * @param {Recipe} recipe - Recipe per cup
 * @returns {number} Maximum cups producible (floored)
 */
export function calculate_maximum_cups_available(supplies, recipe) {
  console.assert(supplies, 'supplies must be defined');
  console.assert(recipe, 'recipe must be defined');

  // Can't make lemonade without lemons
  if (recipe.lemons === 0) return 0;

  return Math.floor(Math.min(
    recipe.lemons > 0 ? supplies.lemons / recipe.lemons : Infinity,
    recipe.sugar > 0 ? supplies.sugar / recipe.sugar : Infinity,
    recipe.ice > 0 ? supplies.ice / recipe.ice : Infinity,
    supplies.cups
  ));
}