import type { Lang } from '../i18n/languages'

/**
 * Site-wide settings. The working title and all interface text live in
 * locales/*.json; this file holds only values that are not translated.
 */

/** The organisation's name, used in the footer. Not translated; shown in capitals. */
export const BRAND_NAME = 'Harisumiran Bhoolku Pradesh'

/**
 * The header logo (src/assets/brand/harisumiran-sf-logo.webp) reads
 * "HARISUMIRAN"; "BHOOLKU PRADESH" sits under it in the Hariprabodham line
 * style. The alt text is the logo's accessible name.
 */
export const BRAND_LOGO_SUBTITLE = 'Bhoolku Pradesh'
export const BRAND_LOGO_ALT = 'Harisumiran Bhoolku Pradesh — A Hariprabodham Parivar Event'

/** The copyright holder named at the foot of every page. Not translated. */
export const COPYRIGHT_HOLDER = 'The Bay Labs'

/**
 * Organisation name and contact for the footer. Left empty until branding is
 * confirmed by the owner (open question 8). Each is a localized text object,
 * for example { "en": "...", "gu": "..." }.
 */
export const ORGANISATION: {
  name: { en: string; gu?: string } | null
  contact: { en: string; gu?: string } | null
} = {
  name: null,
  contact: null,
}

/**
 * Whether a language's text has been reviewed by a fluent reviewer. While a
 * language is false, the footer shows a short "draft translation" note in it.
 * (Open question 4: Gujarati is a draft written by the builder.)
 */
export const TRANSLATION_REVIEWED: Record<Lang, boolean> = {
  en: true,
  gu: false,
}

/** The only keys this site ever writes to localStorage. */
export const STORAGE_KEYS = {
  lang: 'outreach.lang',
  /** A random id, so that this device is counted once (src/crowd/crowd.ts). */
  device: 'outreach.diya.device',
} as const

/**
 * How many different devices must light their diya before the fireworks and
 * the welcome appear for everyone.
 */
export const DIYA_GOAL = 100

/**
 * The name of the current count. Change it to start again from zero (for
 * example after a rehearsal): devices are counted separately for each name.
 * Letters, digits and hyphens only.
 */
export const DIYA_ROUND = 'annakut-2026'
