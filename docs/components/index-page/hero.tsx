import { Logo } from '../logo'
import styles from './hero.module.css'


export const IndexPageHero = () => {
  return <>
    <div className={styles.hero}>
      <div className={styles.hero_ratio}>
        <div className={styles.logo}>
          <Logo />
        </div>

      </div>
    </div>
    <div className="my-6 w-full max-w-[1000px] mx-auto">
      <div className="p-1 relative overflow-hidden shadow-xl flex bg-neutral-800/60 sm:rounded-xl dark:backdrop-blur dark:ring-neutral-700/80">
        <video autoPlay loop playsInline>
          <source src="https://github-production-user-asset-6210df.s3.amazonaws.com/824903/238808661-24521327-25d6-44ae-a6b4-6eb492242862.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  </>
}
