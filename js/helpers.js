import translations from './config.translations.js'

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
 * Translation.
 *
 * @param (string) string
 * @param (string) source : json file or ommitted
 *
 * @return (string)
 */
function t(string, source) {
  const language = navigator.language
  if (source && source[string] && source[string][language]) {
    return source[string][language]
  }
  if (translations[string] && translations[string][language]) {
    return translations[string][language]
  }
  return string
}

export {getRandomNumber, $, t}