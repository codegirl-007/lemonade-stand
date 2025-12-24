/**
 * @fileoverview Canvas controller for scene management.
 * Handles sprites, scene objects, rendering, and game loop.
 */

import {
  canvas,
  ctx,
  createSprite,
  drawSprite,
  drawSpriteWithAlpha,
  drawInstance,
  drawGround,
  drawShadow,
  clearCanvas
} from './canvas.js';

/** @type {Function|null} Callback to invoke on render */
let onRenderCallback = null;

/**
 * Collection of sprite templates (shared image/frame data)
 * @type {Object.<string, import('./canvas.js').Sprite>}
 */
export const sprites = {
  stand: createSprite({ source: 'stand.png' }),
  cup: createSprite({
    source: 'cups.png',
    frameWidth: 251,
    frameHeight: 330,
    frameCount: 2
  }),
  maker: createSprite({
    source: 'maker.png',
    frameWidth: 562 / 2,
    frameHeight: 432,
    frameCount: 2
  }),
  ice: createSprite({
    source: 'ice.png'
  }),
  pitcher: createSprite({
    source: 'pitcher_full.png'
  }),
  lemons: createSprite({
    source: 'lemons.png'
  }),
  grass: createSprite({
    source: 'grass.png'
  }),
  tree: createSprite({
    source: 'tree.png'
  }),
  slide: createSprite({
    source: 'slide.png'
  }),
  seesaw: createSprite({
    source: 'seesaw.png'
  }),
  customer1: createSprite({
    source: 'customer_1.png'
  }),
  customer2: createSprite({
    source: 'customer_2.png'
  }),
  customer3: createSprite({
    source: 'customer_3.png'
  }),
  customer4: createSprite({
    source: 'customer_4.png'
  }),
  customer5: createSprite({
    source: 'customer_5.png'
  }),
  customer6: createSprite({
    source: 'customer_6.png'
  }),
  customer7: createSprite({
    source: 'customer_7.png'
  }),
  customer8: createSprite({
    source: 'customer_8.png'
  }),
  customer9: createSprite({
    source: 'customer_9.png'
  }),
  customer10: createSprite({
    source: 'customer_10.png'
  }),
  customer11: createSprite({
    source: 'customer_11.png'
  }),
  customer12: createSprite({
    source: 'customer_12.png'
  }),
  customer13: createSprite({
    source: 'customer_13.png'
  }),
  customer14: createSprite({
    source: 'customer_14.png'
  }),
  customer15: createSprite({
    source: 'customer_15.png'
  })
};

// Customer positions (alternating left/right)
const customerPositions = [
  { x: 300, y: 180 },  // left
  { x: 700, y: 180 }   // right
];

// Active customer state
export let activeCustomer = {
  spriteKey: null,
  positionIndex: 0,
  alpha: 0
};

// All customer sprite keys
const customerKeys = [
  'customer1', 'customer2', 'customer3', 'customer4', 'customer5',
  'customer6', 'customer7', 'customer8', 'customer9', 'customer10',
  'customer11', 'customer12', 'customer13', 'customer14', 'customer15'
];

/**
 * Sets the active customer for rendering.
 * @param {string|null} spriteKey - Customer sprite key or null
 * @param {number} positionIndex - 0 for left, 1 for right
 * @param {number} alpha - Transparency (0-1)
 */
export function setActiveCustomer(spriteKey, positionIndex, alpha) {
  activeCustomer = { spriteKey, positionIndex, alpha };
}

/**
 * Gets a random customer sprite key.
 * @returns {string} Random customer key
 */
export function getRandomCustomerKey() {
  return customerKeys[Math.floor(Math.random() * customerKeys.length)];
}

/**
 * Checks if all sprites are loaded.
 * @returns {boolean}
 */
export function allSpritesReady() {
  return Object.values(sprites).every(sprite => sprite.ready);
}

/**
 * Waits for all sprites to load, then calls the callback.
 * @param {Function} callback - Function to call when all sprites are ready
 */
export function whenSpritesReady(callback) {
  function check() {
    if (allSpritesReady()) {
      callback();
    } else {
      requestAnimationFrame(check);
    }
  }
  check();
}

/**
 * Creates a cup instance.
 *
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} [scale=0.1] - Render scale
 * @returns {import('./canvas.js').Cup}
 */
export function createCup(x, y, scale = 0.1) {
  return {
    sprite: sprites.cup,
    x,
    y,
    scale,
    frameIndex: 0,
    filled: false,

    /** Fills the cup */
    fill() {
      this.filled = true;
      this.frameIndex = 1;
    },

    /** Empties the cup */
    empty() {
      this.filled = false;
      this.frameIndex = 0;
    },

    /** @returns {boolean} Whether the cup is filled */
    isFilled() {
      return this.filled;
    }
  };
}

/**
 * Game objects - cups on the stand
 * @type {Array<import('./canvas.js').Cup>}
 */
export const cups = [
  createCup(455, 285, 0.15),
  createCup(495, 285, 0.15),
  createCup(535, 285, 0.15),
  createCup(575, 285, 0.15),
];

/**
 * Renders the entire scene.
 */
export function render() {
  clearCanvas();

  // Background
  drawGround(sprites.grass);

  // Background trees
  drawSprite(sprites.tree, 600, 50, 0.25);
  drawSprite(sprites.tree, 200, 50, 0.2);

  // Playground equipment
  drawSprite(sprites.slide, 880, 80, 0.4);
  drawSprite(sprites.seesaw, 200, 280, 0.30);

  // Shadow under the stand
  drawShadow(500, 360, 180, 50);

  // Lemonade stand
  drawSprite(sprites.maker, 430, 160, 0.55);
  drawSprite(sprites.stand, 350, 50, 0.6);
  drawSprite(sprites.pitcher, 620, 260, 0.3);

  // Draw all cup instances
  cups.forEach(cup => drawInstance(cup));

  // Active customer (with fade)
  if (activeCustomer.spriteKey && activeCustomer.alpha > 0) {
    const pos = customerPositions[activeCustomer.positionIndex];
    drawSpriteWithAlpha(sprites[activeCustomer.spriteKey], pos.x, pos.y, 0.45, activeCustomer.alpha);
  }

  // Invoke callback if set
  if (onRenderCallback) onRenderCallback();
}
