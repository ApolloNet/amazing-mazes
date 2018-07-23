import translations from './config.translations.js'

/**
 * $ function as an alias for document.querySelector()
 */
function $(selector) {
  return document.querySelector(selector)
}

/**
 * Translation.
 */
function t(string, source) {
  const language = navigator.language
  if (source) {
    return (source[string] && source[string][language]) ? source[string][language] : string
  }
  return (translations[string] && translations[string][language]) ? translations[string][language] : string
}

export {$, t}