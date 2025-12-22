/**
 * @fileoverview Low-level canvas utilities and sprite system.
 * Provides drawing primitives and sprite management.
 */

/** @type {HTMLCanvasElement} */
export const canvas = document.getElementById('scene');

/** @type {CanvasRenderingContext2D} */
export const ctx = canvas.getContext('2d');

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
 * Creates a new sprite object from the given options.
 *
 * @param {SpriteOptions} options - Configuration options for the sprite
 * @param {Function} [onLoad] - Optional callback when sprite loads
 * @returns {Sprite} The created sprite object
 */
export function createSprite(options, onLoad) {
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
    if (onLoad) onLoad();
  };

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
export function drawSprite(spriteObject, x, y, scale) {
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
export function drawInstance(instance) {
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

/**
 * Draws the ground using a grass sprite as a repeating pattern.
 *
 * @param {Sprite} grassSprite - The grass sprite to use as pattern
 * @param {number} [groundHeight=250] - Height of the ground area
 * @returns {void}
 */
export function drawGround(grassSprite, groundHeight = 250) {
  if (!grassSprite.ready) return;

  const pattern = ctx.createPattern(grassSprite.image, 'repeat');
  ctx.fillStyle = pattern;

  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
}

/**
 * Draws an oval shadow.
 *
 * @param {number} x - Center x position
 * @param {number} y - Center y position
 * @param {number} radiusX - Horizontal radius
 * @param {number} radiusY - Vertical radius
 * @param {string} [color='rgba(0, 0, 0, 0.3)'] - Shadow color
 */
export function drawShadow(x, y, radiusX, radiusY, color = 'rgba(0, 0, 0, 0.3)') {
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Clears the entire canvas.
 */
export function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

