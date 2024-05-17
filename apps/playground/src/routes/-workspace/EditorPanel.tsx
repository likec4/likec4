import { MonacoEditor } from './MonacoEditor'
import { SyncMonacoAndWorkspace } from './SyncMonacoAndWorkspace'

export default function EditorPanel() {
  return (
    <>
      <MonacoEditor />
      <SyncMonacoAndWorkspace />
    </>
  )
}
