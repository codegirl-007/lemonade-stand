/**
 * @fileoverview Canvas controller for scene management.
 * Handles sprites, scene objects, rendering, and game loop.
 */

import {
  canvas,
  ctx,
  createSprite,
  drawSprite,
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
  })
};

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
  createCup(455, 325, 0.15),
  createCup(495, 325, 0.15),
  createCup(535, 325, 0.15),
  createCup(575, 325, 0.15),
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
  drawSprite(sprites.maker, 430, 160, 0.6);
  drawSprite(sprites.stand, 350, 50, 0.7);
  drawSprite(sprites.pitcher, 620, 290, 0.3);

  // Draw all cup instances
  cups.forEach(cup => drawInstance(cup));

  // Invoke callback if set
  if (onRenderCallback) onRenderCallback();
}