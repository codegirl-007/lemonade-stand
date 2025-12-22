/**
 * @fileoverview Lemonade stand game rendering module.
 * Handles sprite loading and canvas rendering.
 */

import { init_game, make_lemonade, set_recipe, set_weather, Weather } from './game.js';

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('scene');

// Initialize game state
let gameState = init_game();

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');

/** @type {number} Global scale factor for rendering */
const scale = 0.4;

/**
 * @typedef {Object} SpriteOptions
 * @property {string} source - Path to the sprite image file
 * @property {number} [frameWidth] - Width of each frame for animated sprites
 * @property {number} [frameHeight] - Height of each frame for animated sprites
 * @property {number} [frameCount=1] - Number of frames in the sprite sheet
 * @property {number} [frameIndex] - Current frame index for animation
 */

/**
 * @typedef {Object} Sprite
 * @property {string} source - Path to the sprite image file
 * @property {HTMLImageElement} image - The loaded image element
 * @property {boolean} ready - Whether the image has finished loading
 * @property {number|null} frameWidth - Width of each frame (null for single-frame sprites)
 * @property {number|null} frameHeight - Height of each frame (null for single-frame sprites)
 * @property {number} frameCount - Total number of frames in the sprite
 * @property {number} [frameIndex] - Current frame index for animation
 */

/**
 * @typedef {Object} Cup
 * @property {Sprite} sprite - Reference to the cup sprite template
 * @property {number} x - X position on canvas
 * @property {number} y - Y position on canvas
 * @property {number} scale - Render scale
 * @property {number} frameIndex - Current frame (0 = empty, 1 = filled)
 * @property {boolean} filled - Whether the cup is filled
 * @property {Function} fill - Fills the cup
 * @property {Function} empty - Empties the cup
 * @property {Function} isFilled - Returns whether cup is filled
 */

/**
 * Collection of sprite templates (shared image/frame data)
 * @type {Object.<string, Sprite>}
 */
const sprites = {
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
 * Creates a cup instance.
 *
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} [scale=0.1] - Render scale
 * @returns {Cup}
 */
function createCup(x, y, scale = 0.1) {
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

// Game objects
const cups = [
  createCup(455, 325, 0.15),
  createCup(495, 325, 0.15),
  createCup(535, 325, 0.15),
  createCup(575, 325, 0.15),

]

/**
 * Creates a new sprite object from the given options.
 * Automatically triggers a render when the image loads.
 *
 * @param {SpriteOptions} options - Configuration options for the sprite
 * @returns {Sprite} The created sprite object
 */
function createSprite(options) {
  const image = new Image();

  const sprite = {
    source: options.source,
    image,
    ready: false,

    // optionals
    frameWidth: options.frameWidth || null,
    frameHeight: options.frameHeight || null,
    frameCount: options.frameCount ?? 1,
    frameIndex: options.frameIndex || 0
  };

  image.onload = () => {
    sprite.ready = true;
    render();
  }

  image.src = options.source;
  return sprite;
}

/**
 * Draws a sprite onto the canvas at the specified position.
 *
 * @param {Sprite} spriteObject - The sprite to draw
 * @param {number} x - The x-coordinate on the canvas
 * @param {number} y - The y-coordinate on the canvas
 * @param {number} scale - Scale factor for rendering
 * @returns {void}
 */
function drawSprite(spriteObject, x, y, scale) {
  if (!spriteObject.ready) return;

  const frameIndex = spriteObject.frameIndex;

  const isFramedSprite = spriteObject.frameWidth !== null
    || spriteObject.frameHeight !== null;

  if (!isFramedSprite) {
    const drawWidth = spriteObject.image.naturalWidth * scale;
    const drawHeight = spriteObject.image.naturalHeight * scale;

    ctx.drawImage(spriteObject.image, x, y, drawWidth, drawHeight);
    return;
  }

  // framed horizontal sprite
  const sourceX = frameIndex * spriteObject.frameWidth;
  const sourceY = 0;

  const drawWidth = spriteObject.frameWidth * scale;
  const drawHeight = spriteObject.frameHeight * scale;

  ctx.drawImage(
    spriteObject.image,
    sourceX,
    sourceY,
    spriteObject.frameWidth,
    spriteObject.frameHeight,
    x,
    y,
    drawWidth,
    drawHeight
  );
}

/**
 * Draws a cup (or any object with sprite, x, y, scale, frameIndex).
 *
 * @param {Cup} instance - The cup to draw
 * @returns {void}
 */
function drawInstance(instance) {
  const { sprite, x, y, scale, frameIndex } = instance;

  if (!sprite.ready) return;

  const isFramedSprite = sprite.frameWidth !== null
    || sprite.frameHeight !== null;

  if (!isFramedSprite) {
    const drawWidth = sprite.image.naturalWidth * scale;
    const drawHeight = sprite.image.naturalHeight * scale;
    ctx.drawImage(sprite.image, x, y, drawWidth, drawHeight);
    return;
  }

  // framed horizontal sprite
  const sourceX = frameIndex * sprite.frameWidth;
  const drawWidth = sprite.frameWidth * scale;
  const drawHeight = sprite.frameHeight * scale;

  ctx.drawImage(
    sprite.image,
    sourceX,
    0,
    sprite.frameWidth,
    sprite.frameHeight,
    x,
    y,
    drawWidth,
    drawHeight
  );
}

function drawGround() {
  if (!sprites.grass.ready) return;

  const pattern = ctx.createPattern(sprites.grass.image, 'repeat');
  ctx.fillStyle = pattern;

  const groundHeight = 250;
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
}

/**
 * Draws an oval shadow.
 *
 * @param {number} x - Center x position
 * @param {number} y - Center y position
 * @param {number} radiusX - Horizontal radius
 * @param {number} radiusY - Vertical radius
 * @param {string} [color='rgba(0, 0, 0, 0.25)'] - Shadow color
 */
function drawShadow(x, y, radiusX, radiusY, color = 'rgba(0, 0, 0, 0.3)') {
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGround();
  drawSprite(sprites.tree, 600, 50, 0.25);
  drawSprite(sprites.tree, 200, 50, 0.2);

  // Slide on the right
  drawSprite(sprites.slide, 880, 80, 0.4);

  // Seesaw
  drawSprite(sprites.seesaw, 200, 280, 0.30);


  // Shadow under the stand
  drawShadow(500, 360, 180, 50);

  drawSprite(sprites.maker, 430, 160, 0.6);
  drawSprite(sprites.stand, 350, 50, 0.7);
  drawSprite(sprites.pitcher, 620, 290, 0.3);


  // Draw all cup instances
  cups.forEach(cup => drawInstance(cup));

}

render();

// Example: fill the first cup after 1 second
setTimeout(() => {
  cups[0].fill();
  sprites.maker.frameIndex = 1;
  render();
}, 1000);
