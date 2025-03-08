import type { ComputedLikeC4ModelData } from '@likec4/core'
import { shallowRef } from 'reactive-vscode'

/**
 * Latest fetched computed model
 * Updated in useRpc
 */
export const computedModels = shallowRef({} as {
  [projectId: string]: ComputedLikeC4ModelData
})
