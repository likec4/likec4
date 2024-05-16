import { type ComputedView, type DiagramView, invariant, type LikeC4Model, type ViewID } from '@likec4/core'
import { changeView, computeView, fetchModel } from '@likec4/language-server/protocol'
import { WasmGraphvizLayouter } from '@likec4/layouts'
import { DEV } from 'esm-env'
import { deepEqual } from 'fast-equals'
import type * as monaco from 'monaco-editor'
import type { UserConfig } from 'monaco-editor-wrapper'
import type { MonacoLanguageClient } from 'monaco-languageclient'
import { first, keys } from 'remeda'
import type { Exact, Simplify } from 'type-fest'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'

import type { LikeC4DiagramProps } from '@likec4/diagram'
import _spec from './examples/bigbank/_spec.c4?raw'
import bigbank from './examples/bigbank/bigbank.c4?raw'

export type WorkspaceStore = {
  /**
   * The name of the workspace.
   * Used as path-prefix.
   */
  name: string
  // userConfig: UserConfig

  editor: () => monaco.editor.IStandaloneCodeEditor | null
  languageClient: () => MonacoLanguageClient | null

  initialized: boolean

  /**
   * The current file (key in files map).
   */
  currentFilename: string

  /**
   * The files in the workspace.
   */
  files: {
    [filename: string]: string
  }

  likeC4Model: LikeC4Model | null

  /**
   * Current diagram.
   */
  computedView: ComputedView | null
  diagram: DiagramView | null
  diagramAsDot: string | null
}

interface WorkspaceStoreActions {
  updateCurrentFile: (content: string) => void

  currentFileContent: () => string

  onDidChangeModel: () => Promise<void>

  fetchDiagram: (viewId: string) => Promise<void>

  onChanges: NonNullable<LikeC4DiagramProps['onChange']>
}

export type WorkspaceState = Simplify<WorkspaceStore & WorkspaceStoreActions>

type CreateWorkspaceStore = Pick<WorkspaceStore, 'name' | 'currentFilename' | 'files'> & {
  /**
   * monaco-editor configuration.
   */
  // userConfig: UserConfig
}

const noReplace = false

let storeDevId = 1

const containsWithId = <T extends { id: string }>(arr: T[], id: string) => arr.some((x) => x.id === id)

export function createWorkspaceStore<T extends CreateWorkspaceStore>({
  name,
  currentFilename,
  files
  // userConfig
}: T) {
  const dot = new WasmGraphvizLayouter()

  return createWithEqualityFn<
    WorkspaceState,
    [
      ['zustand/subscribeWithSelector', never],
      ['zustand/devtools', never]
    ]
  >(
    subscribeWithSelector(
      devtools(
        (set, get) => ({
          name: name,
          editor: () => null,
          languageClient: () => null,
          initialized: false,

          currentFilename,
          files: structuredClone(files),

          likeC4Model: null,
          computedView: null,
          diagram: null,
          diagramAsDot: null,

          updateCurrentFile: (content) => {
            const { currentFilename, files } = get()
            if (content === files[currentFilename]) {
              return
            }
            set(
              {
                files: { ...files, [currentFilename]: content }
              },
              noReplace,
              'updateCurrentFile'
            )
          },

          currentFileContent: () => {
            const { currentFilename, files } = get()
            return files[currentFilename] ?? ''
          },

          onDidChangeModel: async () => {
            const { languageClient, diagram, computedView } = get()
            const client = languageClient()
            invariant(client, 'Language client is not initialized')
            try {
              const { model } = await client.sendRequest(fetchModel)
              if (!model) {
                return
              }
              set({ likeC4Model: model }, noReplace, 'likeC4Model')

              let viewId = computedView?.id ?? diagram?.id
              if (!viewId) {
                const indexId = 'index' as ViewID
                const firstView = indexId in model.views ? indexId : first(keys(model.views))
                if (!firstView) {
                  return
                }
                viewId = firstView as ViewID
              }
              get().fetchDiagram(viewId)
            } catch (e) {
              console.error(e)
            }
          },

          fetchDiagram: async (viewId) => {
            const { languageClient, computedView } = get()
            const client = languageClient()
            invariant(client, 'Language client is not initialized')
            try {
              const { view } = await client.sendRequest(computeView, { viewId })
              if (deepEqual(view, computedView)) {
                return
              }
              if (!view) {
                set(
                  {
                    computedView: null
                  },
                  noReplace,
                  'fetchDiagram'
                )
                return
              }
              const layoutRes = await dot.layout(view).catch(e => {
                console.error(e)
                return {
                  diagram: null,
                  dot: null
                }
              })
              set(
                {
                  computedView: view,
                  diagram: layoutRes.diagram,
                  diagramAsDot: layoutRes.dot
                },
                noReplace,
                'fetchDiagram'
              )
            } catch (e) {
              console.error(e)
            }
          },

          onChanges: ({ changes }) => {
            const { languageClient, diagram } = get()
            const client = languageClient()
            invariant(diagram, 'Diagram is not initialized')
            invariant(client, 'Language client is not initialized')
            void client.sendRequest(changeView, {
              viewId: diagram.id,
              changes
            }).catch(e => {
              console.error(e)
            })
          }
        }),
        {
          name: `WorkspaceStore ${storeDevId++} - ${name}`,
          enabled: DEV
        }
      )
    ),
    shallow
  )
}
