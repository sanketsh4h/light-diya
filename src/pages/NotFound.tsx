import { Link } from 'react-router'
import { useI18n } from '../i18n/context'
import { usePage } from '../components/page-context'
import styles from './pages.module.css'

export default function NotFound() {
  const { t } = useI18n()
  usePage(t('notFound.title'), { to: '/', label: t('nav.home') })
  return (
    <>
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.body')}</p>
      <ul className={styles.links}>
        <li>
          <Link to="/">{t('notFound.home')}</Link>
        </li>
      </ul>
    </>
  )
}
