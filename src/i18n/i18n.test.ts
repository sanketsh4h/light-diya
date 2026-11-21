import { describe, expect, it } from 'vitest'
import { detectLang, isLang } from './languages'
import en from '../../locales/en.json'
import gu from '../../locales/gu.json'
import { interpolate, translate } from './messages'
import { localize, localizedLang } from './localized'

describe('detectLang', () => {
  it('picks Gujarati when the browser asks for it', () => {
    expect(detectLang(['gu-IN', 'en'])).toBe('gu')
    expect(detectLang(['gu'])).toBe('gu')
  })
  it('follows the order of the preference list', () => {
    expect(detectLang(['en-GB', 'gu-IN'])).toBe('en')
    expect(detectLang(['fr', 'gu-IN', 'en'])).toBe('gu')
  })
  it('falls back to English', () => {
    expect(detectLang(['fr-FR', 'de'])).toBe('en')
    expect(detectLang([])).toBe('en')
  })
})

describe('isLang', () => {
  it('accepts only supported codes', () => {
    expect(isLang('gu')).toBe(true)
    expect(isLang('hi')).toBe(false)
    expect(isLang('GU')).toBe(false)
    expect(isLang(null)).toBe(false)
  })
})

describe('interpolate', () => {
  it('replaces {name} placeholders', () => {
    expect(interpolate('Back to {page}', { page: 'Bhulkao' })).toBe('Back to Bhulkao')
    expect(interpolate('{a} and {a}', { a: 1 })).toBe('1 and 1')
  })
  it('leaves unknown placeholders alone', () => {
    expect(interpolate('Hello {who}', {})).toBe('Hello {who}')
  })
})

describe('translate', () => {
  it('uses the chosen language', () => {
    expect(translate('gu', 'intro.diya.light')).toBe('દીવો પ્રગટાવો')
    expect(translate('en', 'intro.diya.light')).toBe('Light the diya')
  })
})

describe('locales', () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
  it('every string has Gujarati text with the same placeholders', () => {
    const guText: Record<string, string> = gu
    for (const [key, text] of Object.entries(en)) {
      expect(text.trim(), `en "${key}"`).not.toBe('')
      expect(guText[key]?.trim(), `gu "${key}"`).toBeTruthy()
      expect(placeholders(guText[key] ?? ''), `placeholders in gu "${key}"`).toEqual(
        placeholders(text),
      )
    }
    expect(Object.keys(guText).sort()).toEqual(Object.keys(en).sort())
  })
})

describe('localize', () => {
  it('falls back to English when a translation is missing or empty', () => {
    expect(localize({ en: 'Hello', gu: '' }, 'gu')).toBe('Hello')
    expect(localize({ en: 'Hello' }, 'gu')).toBe('Hello')
    expect(localizedLang({ en: 'Hello' }, 'gu')).toBe('en')
    expect(localize({ en: 'Hello', gu: 'નમસ્તે' }, 'gu')).toBe('નમસ્તે')
    expect(localizedLang({ en: 'Hello', gu: 'નમસ્તે' }, 'gu')).toBe('gu')
  })
})
