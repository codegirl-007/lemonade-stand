/**
 * @fileoverview Reactive data binding system.
 * Creates a deep reactive Proxy that auto-updates DOM elements with data-bind attributes.
 */

/**
 * Gets a nested property value from an object using dot notation.
 * @param {Object} obj - The object to get the value from
 * @param {string} path - Dot notation path (e.g., "supplies.lemons")
 * @returns {*} The value at the path
 */
function getByPath(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Formats a value based on the format type.
 * @param {*} value - The value to format
 * @param {string} [format] - The format type (e.g., "currency", "number")
 * @returns {string} The formatted value
 */
function formatValue(value, format) {
  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }
  
  if (format === 'number') {
    return new Intl.NumberFormat('en-US').format(value);
  }
  
  return value;
}

/**
 * Updates all DOM elements with data-bind attributes to reflect current state.
 * @param {Object} state - The state object to read values from
 */
export function updateBindings(state) {
  const elements = document.querySelectorAll('[data-bind]');
  
  elements.forEach(el => {
    const path = el.dataset.bind;
    const format = el.dataset.format;
    const value = getByPath(state, path);
    
    if (value !== undefined) {
      el.textContent = formatValue(value, format);
    }
  });
}

/**
 * Creates a deep reactive Proxy that auto-updates DOM bindings on change.
 * @param {Object} target - The initial state object
 * @returns {Proxy} A reactive proxy that updates DOM on changes
 */
export function createReactiveState(target) {
  const handler = {
    get(obj, prop) {
      const value = obj[prop];
      
      // If the value is an object, wrap it in a proxy too (deep reactivity)
      if (typeof value === 'object' && value !== null) {
        return new Proxy(value, handler);
      }
      
      return value;
    },
    
    set(obj, prop, value) {
      obj[prop] = value;
      
      // Update all bound DOM elements
      updateBindings(target);
      
      return true;
    }
  };
  
  return new Proxy(target, handler);
}

