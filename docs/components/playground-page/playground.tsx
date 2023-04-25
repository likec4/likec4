import CodeEditor from './editor'
import styles from './playground.module.css'

export const PlaygroundPage = () => {
  return <div className={styles.playground}>
    <CodeEditor />
  </div>
}
