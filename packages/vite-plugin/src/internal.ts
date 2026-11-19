/**
 * This module is used by the Vite plugin to generate the virtual modules
 */
import type { RelationshipBrowserScope, WebappExportFormat } from '@likec4/config'
import { LikeC4Model } from '@likec4/core/model'
import type { LayoutedLikeC4ModelData, LayoutedView, ProjectId } from '@likec4/core/types'
import { useStore } from '@nanostores/react'
import { createBirpc } from 'birpc'
import { deepEqual, shallowEqual } from 'fast-equals'
import type { Atom, WritableAtom } from 'nanostores'
import { computed } from 'nanostores'
import { useMemo } from 'react'
import type { LikeC4VitePluginRpc } from './rpc/protocol'
import type { ResolvedLikeC4AppOptions } from './types'

export { atom, batch, batched, computed, map, onMount } from 'nanostores'

export { useStore } from '@nanostores/react'

export { deepEqual, shallowEqual }

export type { LayoutedLikeC4ModelData, LayoutedView }

export type { RelationshipBrowserScope, WebappExportFormat }
// Subpath import: the package root pulls in zod and json5
export { WebappExportFormats } from '@likec4/config/webapp-export-formats'
export type { Atom, ReadableAtom, WritableAtom } from 'nanostores'
export type { LikeC4VitePluginRpc } from './rpc/protocol'
export type { ResolvedLikeC4AppOptions as LikeC4AppConfig }

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
  const rpc = createBirpc<LikeC4VitePluginRpc>({}, {
    timeout: 2 * 60 * 1000, // 2 minutes (for applySemanticLayout)
    post: (data) => options.send('likec4:rpc', data),
    on: (fn) => options.on('likec4:rpc', fn),
    onTimeoutError(functionName) {
      return functionName === 'applySemanticLayout'
    },
    onGeneralError(error, functionName) {
      console.error(`RPC error in ${functionName}`, { error })
    },
    onFunctionError: (error, functionName) => {
      console.error(`RPC error in ${functionName}`, { error })
    },
  })
  return rpc
}

// This is a workaround to avoid type errors in the Vite plugin
export function createHooksForModel($atom: WritableAtom<LayoutedLikeC4ModelData>): {
  updateModel: (data: LayoutedLikeC4ModelData) => void
  $likec4model: Atom<LikeC4Model.Layouted>
  useLikeC4Model: () => LikeC4Model.Layouted
  useLikeC4Views: () => ReadonlyArray<LayoutedView>
  useLikeC4View: (viewId: string) => LayoutedView | null
  isLikeC4ViewId: (id: unknown) => id is string
} {
  const $likec4model = computed($atom, (data) => LikeC4Model.create(data))

  function updateModel(data: LayoutedLikeC4ModelData) {
    $atom.set(data)
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
      () => {
        const $computed = computed($likec4model, (model) => model.findView(viewId)?.$layouted ?? null)
        $computed.eq = deepEqual
        return $computed
      },
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
    isLikeC4ViewId: (id: unknown): id is string => typeof id === 'string' && Object.hasOwn($atom.get().views, id),
  }
}

/**
 * Dev only: asks the dev server to open the project config in the editor
 * (the server resolves the path by project id, see `enableOpenProjectInEditor`)
 */
export function openProjectInEditor(projectId: string): void {
  fetch(`/__likec4/open-project?id=${encodeURIComponent(projectId)}`).catch(console.error)
}

/**
 * Dev only: asks the dev server to open the source of an element, relation or view in the editor.
 * Accepts the same params as `onOpenSource` of the diagram, plus `projectId`.
 */
export function openSourceInEditor(params: Record<string, unknown>): void {
  fetch(`/__likec4/open-source?params=${encodeURIComponent(JSON.stringify(params))}`).catch(console.error)
}

type LandingPageConfig =
  | { redirect: true }
  | { include: string[] }
  | { exclude: string[] }

export interface ProjectData {
  readonly id: ProjectId
  readonly title: string
  readonly path: string
  readonly contactPerson: string | undefined
  readonly landingPage: LandingPageConfig | undefined
  readonly relationshipBrowserDefaultScope: RelationshipBrowserScope
  readonly exportFormats: readonly WebappExportFormat[]
}
