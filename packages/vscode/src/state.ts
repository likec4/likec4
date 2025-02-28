import type { ComputedLikeC4Model } from '@likec4/core'
import { shallowRef } from 'reactive-vscode'

/**
 * Latest fetched computed model
 * Updated in useRpc
 */
export const computedModel = shallowRef(null as ComputedLikeC4Model | null)
