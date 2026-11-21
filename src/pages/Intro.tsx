import { useState } from 'react'
import { useI18n } from '../i18n/context'
import { usePage } from '../components/page-context'
import { DiyaLighting } from '../components/DiyaLighting'
import { Fireworks } from '../components/Fireworks'
import { introMotionAllowed } from '../components/intro-motion'
import { EventTitle } from '../components/EventTitle'
import styles from './pages.module.css'

/** The whole site: light the diya, and the welcome and the fireworks appear. */
export default function Intro() {
  const { t } = useI18n()
  usePage(t('site.event'))
  /** Every visit starts unlit; the welcome lines stay out of sight until then. */
  const [lit, setLit] = useState(false)
  const [fireworks, setFireworks] = useState(false)

  function onDiyaLit() {
    setLit(true)
    if (introMotionAllowed()) setFireworks(true)
  }

  return (
    <>
      {fireworks && <Fireworks />}
      <div className={styles.hero}>
        <DiyaLighting onLit={onDiyaLit} />
        <div className={styles.welcome} data-lit={lit ? 'true' : 'false'} data-testid="welcome">
          <EventTitle />
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
      </div>
    </>
  )
}
