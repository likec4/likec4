import type { useDiagramPanel } from '../panel'
import type { useRpc } from '../useRpc'

export type PreviewPanel = ReturnType<typeof useDiagramPanel>
export type RpcClient = ReturnType<typeof useRpc>
