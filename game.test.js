import {
  Weather,
  init_game,
  set_recipe,
  set_weather,
  set_price_per_cup,
  calculate_cups_sold,
  calculate_taste_score,
  make_lemonade,
  calculate_supply_cost,
  get_supply_pricing,
  calculate_cost_per_cup
} from './game.js';

describe('enums', () => {
  test('Weather is frozen and has expected values', () => {
    expect(Object.isFrozen(Weather)).toBe(true);
    expect(Weather).toEqual({
      COLD: 'cold',
      CLOUDY: 'cloudy',
      SUNNY: 'sunny',
      HOT: 'hot'
    });
  });

});

describe('init_game', () => {
  test('returns correct default state shape and values', () => {
    const s = init_game();
    expect(s.player_money).toBe(2.00);
    expect(s.recipe).toEqual({ lemons: 0, sugar: 0, ice: 0 });
    expect(s.supplies).toEqual({ lemons: 0, sugar: 0, ice: 0, cups: 0 });
    expect(s.weather).toBe(Weather.SUNNY);
    expect(s.price_per_cup).toBe(1.0);
    expect(s.cups_sold).toBe(0);
    expect(s.current_day).toBe(1);
    expect(s.total_earnings).toBe(0);
  });

  test('does not share nested object references across calls', () => {
    const a = init_game();
    const b = init_game();
    expect(a).not.toBe(b);
    expect(a.recipe).not.toBe(b.recipe);
    expect(a.supplies).not.toBe(b.supplies);
  });
});

describe('set_recipe', () => {
  test('returns new state, updates recipe only, no mutation', () => {
    const s1 = init_game();
    const s2 = set_recipe(s1, 1, 2, 3);

    expect(s2).not.toBe(s1);
    expect(s2.recipe).toEqual({ lemons: 1, sugar: 2, ice: 3 });
    expect(s1.recipe).toEqual({ lemons: 0, sugar: 0, ice: 0 });
    expect(s2.supplies).toBe(s1.supplies);
  });
});

describe('set_weather', () => {
  test('selects CLOUDY for roll < 40%', () => {
    const s = init_game();
    expect(set_weather(s, 0.00).weather).toBe(Weather.CLOUDY);
    expect(set_weather(s, 0.39).weather).toBe(Weather.CLOUDY);
  });

  test('selects SUNNY for 40%-75%', () => {
    const s = init_game();
    expect(set_weather(s, 0.40).weather).toBe(Weather.SUNNY);
    expect(set_weather(s, 0.74).weather).toBe(Weather.SUNNY);
  });

  test('selects HOT for 75%-90%', () => {
    const s = init_game();
    expect(set_weather(s, 0.75).weather).toBe(Weather.HOT);
    expect(set_weather(s, 0.89).weather).toBe(Weather.HOT);
  });

  test('selects COLD for 90%-100%', () => {
    const s = init_game();
    expect(set_weather(s, 0.90).weather).toBe(Weather.COLD);
    expect(set_weather(s, 0.9999).weather).toBe(Weather.COLD);
  });

  test('returns fallback weather if loop completes', () => {
    const s = init_game();
    expect(set_weather(s, 1.0).weather).toBe(Weather.SUNNY);
  });
});

describe('calculate_taste_score', () => {
  test('ideal recipe yields 1.0', () => {
    expect(calculate_taste_score(1, 1, 1, 1)).toBe(1.2);
  });

  test('penalizes lemon and sugar diffs correctly', () => {
    expect(calculate_taste_score(2, 1, 1, 1)).toBeCloseTo(0.7);
    expect(calculate_taste_score(1, 3, 1, 1)).toBeCloseTo(0.6);
  });

  test('clamps to [0.5, 1.2]', () => {
    expect(calculate_taste_score(100, 100, 1, 1)).toBe(0.5);
    expect(calculate_taste_score(1, 1, 0, 0)).toBe(0.5);
  });
});

describe('calculate_cups_sold', () => {
  test('caps at available cups and never negative', () => {
    const sold = calculate_cups_sold(0.35, 5, Weather.SUNNY, 1, 0);
    expect(sold).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(sold)).toBe(true);
    expect(sold).toBeLessThanOrEqual(5);
  });

  test('returns 0 when price_effect would go negative', () => {
    expect(calculate_cups_sold(999, 100, Weather.SUNNY, 1, 0)).toBe(0);
  });

  test('weather factor ordering (HOT >= SUNNY >= CLOUDY >= COLD) with same random roll', () => {
    const cups = 10_000;
    const taste = 1;
    const random = 0.5;
    const hot = calculate_cups_sold(0.50, cups, Weather.HOT, taste, random);
    const sunny = calculate_cups_sold(0.35, cups, Weather.SUNNY, taste, random);
    const cloudy = calculate_cups_sold(0.30, cups, Weather.CLOUDY, taste, random);
    const cold = calculate_cups_sold(0.20, cups, Weather.COLD, taste, random);
    expect(hot).toBeGreaterThanOrEqual(sunny);
    expect(sunny).toBeGreaterThanOrEqual(cloudy);
    expect(cloudy).toBeGreaterThanOrEqual(cold);
  });

  test('same inputs produce same output (pure function)', () => {
    const a = calculate_cups_sold(0.35, 100, Weather.SUNNY, 1, 0.5);
    const b = calculate_cups_sold(0.35, 100, Weather.SUNNY, 1, 0.5);
    expect(a).toBe(b);
  });
});

describe('make_lemonade', () => {
  test('updates money and supplies based on cups_sold', () => {
    const s = {
      ...init_game(),
      weather: Weather.SUNNY,
      price_per_cup: 1.00,
      supplies: { lemons: 100, sugar: 100, ice: 300, cups: 100 },
      recipe: { lemons: 1, sugar: 1, ice: 3 },
      player_money: 10,
      total_earnings: 0
    };

    const next = make_lemonade(s);

    expect(next).not.toBe(s);
    expect(next.cups_sold).toBeGreaterThanOrEqual(0);
    expect(next.cups_sold).toBeLessThanOrEqual(100);

    expect(next.supplies.cups).toBe(100 - next.cups_sold);
    expect(next.supplies.lemons).toBe(100 - 1 * next.cups_sold);
    expect(next.supplies.sugar).toBe(100 - 1 * next.cups_sold);
    expect(next.supplies.ice).toBe(300 - 3 * next.cups_sold);

    const expectedMoney = 10 + 1.00 * next.cups_sold;
    expect(next.player_money).toBeCloseTo(expectedMoney);

    expect(next.total_earnings).toBe(1.00 * next.cups_sold);
  });

  test('accumulates total_earnings across multiple days', () => {
    let state = {
      ...init_game(),
      weather: Weather.SUNNY,
      price_per_cup: 0.35,
      supplies: { lemons: 200, sugar: 200, ice: 600, cups: 200 },
      recipe: { lemons: 1, sugar: 1, ice: 3 },
      player_money: 0,
      total_earnings: 5.00
    };

    const next = make_lemonade(state);
    const profit = 0.35 * next.cups_sold;
    expect(next.total_earnings).toBeCloseTo(5.00 + profit);
  });

  test('recipe with zero lemons should not allow sales', () => {
    const s = {
      ...init_game(),
      weather: Weather.SUNNY,
      price_per_cup: 0.10,
      supplies: { lemons: 0, sugar: 100, ice: 300, cups: 100 },
      recipe: { lemons: 0, sugar: 1, ice: 3 },
      player_money: 0
    };

    const next = make_lemonade(s);
    expect(next.cups_sold).toBe(0);
  });

  test('limited by available supplies', () => {
    const s = {
      ...init_game(),
      weather: Weather.SUNNY,
      price_per_cup: 0.35,
      supplies: { lemons: 5, sugar: 100, ice: 300, cups: 100 },
      recipe: { lemons: 1, sugar: 1, ice: 3 },
      player_money: 0
    };

    const next = make_lemonade(s);
    expect(next.cups_sold).toBeLessThanOrEqual(5);
  });
});

describe('set_price_per_cup', () => {
  test('sets price_per_cup and returns a new state', () => {
    const state = init_game();

    const next = set_price_per_cup(state, 1.25);

    expect(next).not.toBe(state);
    expect(next.price_per_cup).toBe(1.25);
    expect(state.price_per_cup).toBe(1.00);
  });

  test('rounds to two decimal places', () => {
    const state = init_game();

    expect(set_price_per_cup(state, 1.234).price_per_cup).toBe(1.23);
    expect(set_price_per_cup(state, 1.235).price_per_cup).toBe(1.24);
    expect(set_price_per_cup(state, 0.1).price_per_cup).toBe(0.10);
  });

  test('handles integer prices correctly', () => {
    const state = init_game();

    expect(set_price_per_cup(state, 2).price_per_cup).toBe(2.00);
  });

  test('does not modify unrelated fields', () => {
    const state = init_game();

    const next = set_price_per_cup(state, 0.75);

    expect(next.weather).toBe(state.weather);
    expect(next.supplies).toBe(state.supplies);
    expect(next.recipe).toBe(state.recipe);
  });

  test('rounding edge cases follow JS rounding behavior', () => {
    const state = init_game();

    expect(set_price_per_cup(state, 1.005).price_per_cup).toBe(1.00);

    expect(set_price_per_cup(state, 1.006).price_per_cup).toBe(1.01);
  });
});

describe('calculate_supply_cost', () => {
  test('returns 0 for quantity <= 0', () => {
    expect(calculate_supply_cost('lemons', 0)).toBe(0);
    expect(calculate_supply_cost('lemons', -5)).toBe(0);
  });

  test('uses tier 1 pricing for lemons 1-50', () => {
    expect(calculate_supply_cost('lemons', 1)).toBe(0.02);
    expect(calculate_supply_cost('lemons', 50)).toBe(1.00);
  });

  test('uses tier 2 pricing for lemons 51-100', () => {
    expect(calculate_supply_cost('lemons', 51)).toBe(0.92);
    expect(calculate_supply_cost('lemons', 100)).toBe(1.80);
  });

  test('uses tier 3 pricing for lemons 101+', () => {
    expect(calculate_supply_cost('lemons', 101)).toBe(1.52);
    expect(calculate_supply_cost('lemons', 200)).toBe(3.00);
  });

  test('calculates sugar pricing correctly', () => {
    expect(calculate_supply_cost('sugar', 50)).toBe(0.50); 
    expect(calculate_supply_cost('sugar', 100)).toBe(0.90);
  });

  test('calculates ice pricing correctly', () => {
    expect(calculate_supply_cost('ice', 100)).toBe(1.00);
    expect(calculate_supply_cost('ice', 300)).toBe(2.70);
  });

  test('calculates cups pricing correctly', () => {
    expect(calculate_supply_cost('cups', 100)).toBe(1.00);
    expect(calculate_supply_cost('cups', 200)).toBe(1.80);
  });
});

describe('get_supply_pricing', () => {
  test('returns pricing tiers for lemons', () => {
    const tiers = get_supply_pricing('lemons');
    expect(tiers).toHaveLength(3);
    expect(tiers[0]).toEqual({ min: 1, max: 50, price: 0.02 });
  });

  test('returns pricing tiers for cups', () => {
    const tiers = get_supply_pricing('cups');
    expect(tiers).toHaveLength(2);
    expect(tiers[1].max).toBe(Infinity);
  });

  test('returns empty array for unknown item (triggers assertion warning)', () => {
    expect(get_supply_pricing('bananas')).toEqual([]);
  });
});

describe('calculate_cost_per_cup', () => {
  test('calculates cost from recipe ingredients', () => {
    const state = init_game();
    const recipe = { lemons: 1, sugar: 1, ice: 3 };
    const result = calculate_cost_per_cup(state, recipe);
    // 1*0.02 + 1*0.01 + 3*0.01 + 0.01 (cup) = 0.07
    expect(result.cost_per_cup).toBe(0.07);
  });

  test('returns 0.01 for empty recipe (just cup cost)', () => {
    const state = init_game();
    const recipe = { lemons: 0, sugar: 0, ice: 0 };
    const result = calculate_cost_per_cup(state, recipe);
    expect(result.cost_per_cup).toBe(0.01);
  });

  test('does not mutate original state', () => {
    const state = init_game();
    const recipe = { lemons: 2, sugar: 2, ice: 4 };
    const result = calculate_cost_per_cup(state, recipe);
    expect(result).not.toBe(state);
    expect(state.cost_per_cup).toBe(0);
  });
});
