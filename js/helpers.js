/**
 * Get random number
 *
 * @param (int) max
 *
 * @return (int)
 */
function getRandomNumber(max) {
  return Math.floor(max * Math.random())
}

/**
 * $ function as an alias for document.querySelector()
 *
 * @param selector
 *
 * @return DOM node
 */
function $(selector) {
  return document.querySelector(selector)
}

/**
 * Is it a "touch device" ?
 */
function isTouch() {
  return ('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0)
}

/**
 * Export.
 */
export {getRandomNumber, $, isTouch}