import { Logo } from '../logo'
import styles from './hero.module.css'


export const IndexPageHero = () => {
  return <div className={styles.hero}>
    <div className={styles.hero_ratio}>
      <div className={styles.logo}>
          <Logo/>
      </div>

    </div>
  </div>
}
