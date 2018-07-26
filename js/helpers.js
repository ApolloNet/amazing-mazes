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
 * @param (string) source : 'json' or ommitted
 *
 * @return (string)
 */
function t(string, source) {
  const language = navigator.language
  if (source) {
    return (source[string] && source[string][language]) ? source[string][language] : string
  }
  return (translations[string] && translations[string][language]) ? translations[string][language] : string
}

export {getRandomNumber, $, t}