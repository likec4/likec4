import { Logo } from '../logo'
import styles from './hero.module.css'


export const IndexPageHero = () => {
  return <div className={styles.hero}>
    <Logo className={styles.logo}/>
  </div>
}
