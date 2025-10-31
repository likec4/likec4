import type { ComputedLikeC4ModelData } from '@likec4/core'
import { ref, shallowRef } from 'reactive-vscode'

/**
 * Latest fetched computed model
 * Updated in useRpc
 */
export const computedModels = shallowRef({} as {
  [projectId: string]: ComputedLikeC4ModelData
})

/**
 * Updated in useMessenger when save-view-snapshot is called
 * Holds the URI of the latest updated snapshot file
 * Ignored in FsWatcher to prevent reload loops
 */
export const latestUpdatedSnapshotUri = ref<string | null>(null)
