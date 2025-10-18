import type { useDiagramPanel } from '../common/useDiagramPanel'
import type { useRpc } from '../Rpc'

export type PreviewPanel = ReturnType<typeof useDiagramPanel>
export type RpcClient = ReturnType<typeof useRpc>
