import { MonacoEditor } from './MonacoEditor'
import { SyncMonacoAndWorkspace } from './SyncMonacoAndWorkspace'

export function EditorPanel() {
  return (
    <>
      <MonacoEditor />
      <SyncMonacoAndWorkspace />
    </>
  )
}
