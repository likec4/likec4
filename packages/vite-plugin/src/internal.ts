/**
 * This module is used by the Vite plugin to generate the virtual modules
 */
import { LikeC4Model } from '@likec4/core/model'
import type { LayoutedLikeC4ModelData, LayoutedView } from '@likec4/core/types'
import { useStore } from '@nanostores/react'
import { createBirpc } from 'birpc'
import { deepEqual, shallowEqual } from 'fast-equals'
import type { Atom, WritableAtom } from 'nanostores'
import { computed } from 'nanostores'
import { useMemo } from 'react'
import { mapValues } from 'remeda'
import type { LikeC4VitePluginRpc } from './rpc/protocol'

export { atom, batched, computed, map } from 'nanostores'

export { useStore } from '@nanostores/react'

export type { Atom, ReadableAtom, WritableAtom } from 'nanostores'
export type { LikeC4VitePluginRpc } from './rpc/protocol'

export interface LikeC4VitePluginRpcOptions {
  /**
   * Function to post raw message
   */
  send: (event: string, data: any) => void
  /**
   * Listener to receive raw message
   */
  on: (event: string, fn: (data: any, ...extras: any[]) => void) => void
}

/**
 * Create a PluginRPC instance for the LikeC4 Vite plugin
 * used by the Vite plugin in virtual modules
 */
export function createRpc(options: LikeC4VitePluginRpcOptions): LikeC4VitePluginRpc {
  return createBirpc({}, {
    post: (data) => options.send('likec4:rpc', data),
    on: (fn) => options.on('likec4:rpc', fn),
    onGeneralError(error, functionName) {
      console.error(`RPC error in ${functionName}`, { error })
    },
    onFunctionError: (error, functionName) => {
      console.error(`RPC error in ${functionName}`, { error })
    },
  })
}

// This is a workaround to avoid type errors in the Vite plugin
export function createHooksForModel($atom: WritableAtom<LayoutedLikeC4ModelData>): {
  updateModel: (data: LayoutedLikeC4ModelData) => void
  $likec4model: Atom<LikeC4Model.Layouted>
  useLikeC4Model: () => LikeC4Model.Layouted
  useLikeC4Views: () => ReadonlyArray<LayoutedView>
  useLikeC4View: (viewId: string) => LayoutedView | null
} {
  const $likec4model = computed($atom, (data) => LikeC4Model.create(data))

  function updateModel(data: LayoutedLikeC4ModelData) {
    const current = $atom.get()
    const next = {
      ...data,
      views: mapValues(data.views, (next) => {
        const currentView = current.views[next.id]
        return deepEqual(currentView, next) ? currentView : next
      }),
    }
    // Check for shallow first, then deep equality to avoid unnecessary updates
    if (shallowEqual(next.views, current.views) && deepEqual(next, current)) {
      return
    }
    $atom.set(next as LayoutedLikeC4ModelData)
  }

  // Return views with manual layouts applied via $layouted (#2553).
  const $likec4views: Atom<ReadonlyArray<LayoutedView>> = computed(
    $likec4model,
    (model) => [...model.views()].map(v => v.$layouted),
  )

  function useLikeC4Model(): LikeC4Model.Layouted {
    return useStore($likec4model)
  }

  function useLikeC4Views(): ReadonlyArray<LayoutedView> {
    return useStore($likec4views)
  }

  function useLikeC4View(viewId: string): LayoutedView | null {
    const $view = useMemo(
      () => computed($likec4model, (model) => model.findView(viewId)?.$layouted ?? null),
      [viewId],
    )
    return useStore($view)
  }

  return {
    updateModel,
    $likec4model,
    useLikeC4Model,
    useLikeC4Views,
    useLikeC4View,
  }
}
