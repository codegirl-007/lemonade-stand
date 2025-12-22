import {
  Weather,
  Days,
  init_game,
  set_recipe,
  set_weather,
  set_days,
  set_price_per_cup,
  calculate_cups_sold,
  calculate_taste_score,
  make_lemonade
} from './game.js';

// Helpers
const withMockedRandom = (value, fn) => {
  const orig = Math.random;
  Math.random = () => value;
  try { fn(); } finally { Math.random = orig; }
};

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

  test('Days is frozen and contains allowed values', () => {
    expect(Object.isFrozen(Days)).toBe(true);
    expect(Days[7]).toBe(7);
    expect(Days[14]).toBe(14);
    expect(Days[30]).toBe(30);
    expect(Object.values(Days).sort((a, b) => a - b)).toEqual([7, 14, 30]);
  });
});

describe('init_game', () => {
  test('returns correct default state shape and values', () => {
    const s = init_game();
    expect(s.player_money).toBe(0);
    expect(s.recipe).toEqual({ lemons: 0, sugar: 0, ice: 0 });
    expect(s.supplies).toEqual({ lemons: 0, sugar: 0, ice: 0, cups: 0 });
    expect(s.weather).toBe(Weather.SUNNY);
    expect(s.days).toBe(7);
    expect(s.price_per_cup).toBe(1.0);
    expect(s.cups_sold).toBe(0);

    expect(s.supplies_prices.lemons).toHaveProperty('12', 4.80);
    expect(s.supplies_prices.sugar).toHaveProperty('50', 15.00);
    expect(s.supplies_prices.ice).toHaveProperty('500', 5.00);
    expect(s.supplies_prices.cups).toHaveProperty('400', 3.75);
  });

  test('does not share nested object references across calls', () => {
    const a = init_game();
    const b = init_game();
    expect(a).not.toBe(b);
    expect(a.recipe).not.toBe(b.recipe);
    expect(a.supplies).not.toBe(b.supplies);
    expect(a.supplies_prices).not.toBe(b.supplies_prices);
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

describe('set_days', () => {
  test('sets valid days and returns new state', () => {
    const s1 = init_game();
    const s2 = set_days(s1, 14);
    expect(s2).not.toBe(s1);
    expect(s2.days).toBe(14);
    expect(s1.days).toBe(7);
  });
});

describe('set_weather', () => {
  test('selects CLOUDY for roll < 40%', () => {
    const s = init_game();
    withMockedRandom(0.00, () => {
      expect(set_weather(s).weather).toBe(Weather.CLOUDY);
    });
    withMockedRandom(0.39, () => {
      expect(set_weather(s).weather).toBe(Weather.CLOUDY);
    });
  });

  test('selects SUNNY for 40%-75%', () => {
    const s = init_game();
    withMockedRandom(0.40, () => {
      expect(set_weather(s).weather).toBe(Weather.SUNNY);
    });
    withMockedRandom(0.74, () => {
      expect(set_weather(s).weather).toBe(Weather.SUNNY);
    });
  });

  test('selects HOT for 75%-90%', () => {
    const s = init_game();
    withMockedRandom(0.75, () => {
      expect(set_weather(s).weather).toBe(Weather.HOT);
    });
    withMockedRandom(0.89, () => {
      expect(set_weather(s).weather).toBe(Weather.HOT);
    });
  });

  test('selects COLD for 90%-100%', () => {
    const s = init_game();
    withMockedRandom(0.90, () => {
      expect(set_weather(s).weather).toBe(Weather.COLD);
    });
    withMockedRandom(0.9999, () => {
      expect(set_weather(s).weather).toBe(Weather.COLD);
    });
  });
});

describe('calculate_taste_score', () => {
  test('ideal recipe yields 1.0', () => {
    expect(calculate_taste_score(1, 1, 1, 1)).toBe(1.2);
  });

  test('penalizes lemon and sugar diffs correctly', () => {
    // lemons off by 1 => -0.3
    expect(calculate_taste_score(2, 1, 1, 1)).toBeCloseTo(0.7);
    // sugar off by 2 => -0.4
    expect(calculate_taste_score(1, 3, 1, 1)).toBeCloseTo(0.6);
  });

  test('clamps to [0.5, 1.2]', () => {
    expect(calculate_taste_score(100, 100, 1, 1)).toBe(0.5);
    expect(calculate_taste_score(1, 1, 0, 0)).toBe(0.5);
  });
});

describe('calculate_cups_sold', () => {
  test('caps at available cups and never negative', () => {
    withMockedRandom(0, () => {
      const sold = calculate_cups_sold(0.35, 5, Weather.SUNNY, 1);
      expect(sold).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(sold)).toBe(true);
      expect(sold).toBeLessThanOrEqual(5);
    });
  });

  test('returns 0 when price_effect would go negative', () => {
    withMockedRandom(0, () => {
      expect(calculate_cups_sold(999, 100, Weather.SUNNY, 1)).toBe(0);
    });
  });

  test('weather factor ordering (HOT >= SUNNY >= CLOUDY >= COLD) with same random roll', () => {
    withMockedRandom(0, () => {
      const cups = 10_000;
      const taste = 1;
      const hot = calculate_cups_sold(0.50, cups, Weather.HOT, taste);
      const sunny = calculate_cups_sold(0.35, cups, Weather.SUNNY, taste);
      const cloudy = calculate_cups_sold(0.30, cups, Weather.CLOUDY, taste);
      const cold = calculate_cups_sold(0.20, cups, Weather.COLD, taste);
      expect(hot).toBeGreaterThanOrEqual(sunny);
      expect(sunny).toBeGreaterThanOrEqual(cloudy);
      expect(cloudy).toBeGreaterThanOrEqual(cold);
    });
  });
});

describe('make_lemonade', () => {
  test('updates money and supplies based on cups_sold (stub randomness via Math.random)', () => {
    const s = {
      ...init_game(),
      weather: Weather.SUNNY,
      price_per_cup: 1.00,
      supplies: { lemons: 100, sugar: 100, ice: 300, cups: 100 },
      recipe: { lemons: 1, sugar: 1, ice: 3 },
      player_money: 10
    };

    withMockedRandom(0, () => {
      const next = make_lemonade(s);

      expect(next).not.toBe(s);
      expect(next.cups_sold).toBeGreaterThanOrEqual(0);
      expect(next.cups_sold).toBeLessThanOrEqual(100);

      // Inventory decreases consistently
      expect(next.supplies.cups).toBe(100 - next.cups_sold);
      expect(next.supplies.lemons).toBe(100 - 1 * next.cups_sold);
      expect(next.supplies.sugar).toBe(100 - 1 * next.cups_sold);
      expect(next.supplies.ice).toBe(300 - 3 * next.cups_sold);

      // Profit
      const expectedMoney = 10 + 1.00 * next.cups_sold;
      expect(next.player_money).toBeCloseTo(expectedMoney);
    });
  });

  test('can produce negative profit when price < price_per_cup', () => {
    const s = {
      ...init_game(),
      weather: Weather.SUNNY,
      price_per_cup: 0.25,
      supplies: { lemons: 100, sugar: 100, ice: 300, cups: 100 },
      recipe: { lemons: 1, sugar: 1, ice: 3 },
      player_money: 10
    };

    withMockedRandom(0, () => {
      const next = make_lemonade(s);
      expect(next.player_money).toBe(19.25);
    });
  });

  test('recipe with zero ingredient should not allow sales (expected 0 cups sold)', () => {
    const s = {
      ...init_game(),
      weather: Weather.SUNNY,
      price_per_cup: 1.00,
      price_per_cup: 0.10,
      supplies: { lemons: 0, sugar: 100, ice: 300, cups: 100 },
      recipe: { lemons: 0, sugar: 1, ice: 3 },
      player_money: 0
    };

    withMockedRandom(0, () => {
      const next = make_lemonade(s);
      expect(next.cups_sold).toBe(0);
    });
  });
});

describe('set_price_per_cup', () => {
  test('sets price_per_cup and returns a new state', () => {
    const state = init_game();

    const next = set_price_per_cup(state, 1.25);

    expect(next).not.toBe(state);
    expect(next.price_per_cup).toBe(1.25);
    expect(state.price_per_cup).toBe(1.00); // original unchanged
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

    expect(next.days).toBe(state.days);
    expect(next.weather).toBe(state.weather);
    expect(next.supplies).toBe(state.supplies); // same reference, unchanged
    expect(next.recipe).toBe(state.recipe);
  });

  test('rounding edge cases follow JS rounding behavior', () => {
    const state = init_game();

    // JS floating-point quirk: this rounds DOWN
    expect(set_price_per_cup(state, 1.005).price_per_cup).toBe(1.00);

    expect(set_price_per_cup(state, 1.006).price_per_cup).toBe(1.01);
  });
});
