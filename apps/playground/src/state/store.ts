import { type ComputedView, type DiagramView, invariant, type LikeC4Model, type ViewID } from '@likec4/core'
import { changeView, computeView, fetchModel, locate, type LocateParams } from '@likec4/language-server/protocol'
import { DEV } from 'esm-env'
import { deepEqual } from 'fast-equals'
import type { MonacoLanguageClient } from 'monaco-languageclient'
import type { Simplify } from 'type-fest'
import type { Location } from 'vscode-languageserver-protocol'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'

import type { LikeC4DiagramProps } from '@likec4/diagram'
import { graphvizLayouter } from '@likec4/layouts'
import { nanoid } from 'nanoid'
import { mergeDeep } from 'remeda'
import { LikeC4WorkspacesKey, type LocalStorageWorkspace } from './use-workspaces'

export type WorkspaceStore = {
  readonly uniqueId: string
  /**
   * The name of the workspace.
   * Used as path-prefix.
   */
  name: string

  title: string

  languageClient: {
    (): MonacoLanguageClient | null
  }

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

  originalFiles: {
    [filename: string]: string
  }

  likeC4Model: LikeC4Model | null
  modelFetched: boolean

  /**
   * Current diagram.
   */
  computedView: ComputedView | null
  diagram: DiagramView | null
  diagramAsDot: string | null

  requestedLocation: Location | null
}

interface WorkspaceStoreActions {
  isModified: () => boolean
  updateCurrentFile: (content: string) => void

  currentFileContent: () => string

  onDidChangeModel: () => Promise<void>

  fetchDiagram: (viewId: string) => Promise<void>

  onChanges: NonNullable<LikeC4DiagramProps['onChange']>

  showLocation: (location: LocateParams) => Promise<void>
}

export type WorkspaceState = Simplify<WorkspaceStore & WorkspaceStoreActions>

type CreateWorkspaceStore = Pick<WorkspaceStore, 'name' | 'title' | 'currentFilename' | 'files'> & {
  skipHydration?: boolean
  /**
   * monaco-editor configuration.
   */
  // userConfig: UserConfig
}

const noReplace = false

let storeDevId = 1

const containsWithId = <T extends { id: string }>(arr: T[], id: string) => arr.some((x) => x.id === id)

type PersistedState = Pick<WorkspaceState, 'name' | 'title' | 'currentFilename' | 'files' | 'originalFiles'>

export function createWorkspaceStore<T extends CreateWorkspaceStore>({
  name,
  title,
  currentFilename,
  files,
  skipHydration
  // userConfig
}: T) {
  let seq = 1
  const uniqueId = nanoid(6)
  return createWithEqualityFn<
    WorkspaceState,
    [
      ['zustand/persist', PersistedState],
      ['zustand/subscribeWithSelector', never],
      ['zustand/devtools', never]
    ]
  >(
    persist(
      subscribeWithSelector(
        devtools<WorkspaceState>(
          (set, get) => ({
            uniqueId,
            name: name,
            title: title,
            languageClient: () => null,
            initialized: false,

            currentFilename,
            files: structuredClone(files),
            originalFiles: structuredClone(files),

            likeC4Model: null,
            modelFetched: false,
            computedView: null,
            diagram: null,
            diagramAsDot: null,
            requestedLocation: null,

            isModified: () => {
              const { files, originalFiles } = get()
              return !shallow(files, originalFiles)
            },

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
              const label = `onDidChangeModel (${seq++})`
              if (DEV) {
                console.time(label)
                console.log(`start ${label}`)
              }
              const { languageClient, diagram, computedView, modelFetched } = get()
              const client = languageClient()
              invariant(client, 'Language client is not initialized')
              try {
                const { model } = await client.sendRequest(fetchModel)
                set({ likeC4Model: model }, noReplace, 'likeC4Model')

                const indexId = 'index' as ViewID
                const viewId = computedView?.id ?? diagram?.id ?? indexId
                if (!model?.views[viewId]) {
                  DEV && console.warn(`View ${viewId} not found in model.`)
                  set({ computedView: null })
                  return
                }
                await get().fetchDiagram(viewId)
              } catch (e) {
                console.error(e)
              } finally {
                if (!modelFetched) {
                  set({ modelFetched: true }, noReplace, 'modelFetched')
                }

                DEV && console.timeEnd(label)
              }
            },

            fetchDiagram: async (viewId) => {
              const label = `fetchDiagram: ${viewId}`
              if (DEV) {
                console.time(label)
                console.log(`start ${label}`)
              }
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
                const layoutRes = await graphvizLayouter.layout(view).catch(e => {
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
                if (view.id !== computedView?.id) {
                  get().showLocation({ view: view.id })
                }
              } catch (e) {
                console.error(e)
              } finally {
                DEV && console.timeEnd(label)
              }
            },

            onChanges: ({ change }) => {
              const { languageClient, diagram } = get()
              invariant(diagram, 'Diagram is not initialized')
              const client = languageClient()
              invariant(client, 'Language client is not initialized')
              void client
                .sendRequest(changeView, {
                  viewId: diagram.id,
                  change
                })
                .then((location) => {
                  if (location) {
                    set({ requestedLocation: location })
                  }
                }, e => {
                  console.error(e)
                })
            },

            showLocation: async (request) => {
              const { languageClient } = get()
              const client = languageClient()
              invariant(client, 'Language client is not initialized')
              const location = await client.sendRequest(locate, request)
              if (location) {
                set({ requestedLocation: location })
              }
            }
          }),
          {
            name: `WorkspaceStore ${storeDevId++} - ${name}`,
            enabled: DEV
          }
        )
      ),
      {
        name: `likec4:workspace:${name}`,
        partialize: (s: WorkspaceState) => ({
          name: s.name,
          title: s.title,
          currentFilename: s.currentFilename,
          files: s.files,
          originalFiles: s.originalFiles
        }),
        merge: (persistedState, currentState) => mergeDeep(currentState, persistedState as any),
        skipHydration: skipHydration ?? false,
        onRehydrateStorage({ name, title }) {
          try {
            const jsonworkspaces = localStorage.getItem(LikeC4WorkspacesKey) ?? '[]'
            const workspaces = JSON.parse(jsonworkspaces) as Array<LocalStorageWorkspace>
            if (!workspaces.some((w) => w.name === name)) {
              workspaces.push({
                key: `likec4:workspace:${name}`,
                name,
                title
              })
              localStorage.setItem(LikeC4WorkspacesKey, JSON.stringify(workspaces))
            }
          } catch (e) {
            console.error(e)
          }
        }
      }
    ),
    shallow
  )
}
