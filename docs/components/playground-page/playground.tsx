import { useFilesStore, updateFile } from './data'
import { MonacoEditor } from './editor'
import styles from './playground.module.css'

export default function PlaygroundPage() {

  const current = useFilesStore(s => s.current)

  return <div className={styles.playground}>
    <MonacoEditor
      currentFile={current}
      initiateFiles={() => useFilesStore.getState().files}
      onChange={value => updateFile(current, value)}
    />
  </div>
}
