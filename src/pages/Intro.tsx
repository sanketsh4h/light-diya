import { useState } from 'react'
import { useI18n } from '../i18n/context'
import { usePage } from '../components/page-context'
import { DiyaLighting } from '../components/DiyaLighting'
import { Fireworks } from '../components/Fireworks'
import { introMotionAllowed } from '../components/intro-motion'
import { EventTitle } from '../components/EventTitle'
import styles from './pages.module.css'

/** The whole site: light the diya, and the fireworks begin. */
export default function Intro() {
  const { t } = useI18n()
  usePage(t('site.event'))
  /** Fresh lighting only — not when the tab already had the diya lit. */
  const [fireworks, setFireworks] = useState(false)

  function onDiyaLit() {
    if (introMotionAllowed()) setFireworks(true)
  }

  return (
    <>
      {fireworks && <Fireworks />}
      <div className={styles.hero}>
        <DiyaLighting onLit={onDiyaLit} />
        <EventTitle />
        <p className={styles.heroLine}>{t('site.title')}</p>
        <p className={styles.heroValue} data-testid="atmiyata">
          {t('site.value')}
        </p>
        <p className={styles.heroTheme}>
          {t('site.theme.lead')}
          <span data-harmony data-testid="harmony">
            {t('site.theme.focus')}
          </span>
        </p>
      </div>
    </>
  )
}
