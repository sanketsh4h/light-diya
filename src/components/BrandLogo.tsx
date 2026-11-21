import { BRAND_LOGO_ALT, BRAND_LOGO_SUBTITLE } from '../config/site'
import styles from './BrandLogo.module.css'

/**
 * The official Harisumiran logo, tinted with the current text colour, with
 * "BHOOLKU PRADESH" set under the wordmark in the Hariprabodham line style.
 * Its accessible name is the logo's alt text.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={[styles.logo, className].filter(Boolean).join(' ')} lang="en">
      <span className={styles.artwork} aria-hidden="true" />
      <span className={styles.subtitle} aria-hidden="true">
        {BRAND_LOGO_SUBTITLE}
      </span>
      <span className="visually-hidden">{BRAND_LOGO_ALT}</span>
    </span>
  )
}
