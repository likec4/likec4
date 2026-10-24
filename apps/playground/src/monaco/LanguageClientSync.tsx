import type { LayoutedModelApi } from '$components/drawio/DrawioContextMenuProvider'
import type { IDisposable } from '@codingame/monaco-vscode-editor-api'
import type { DiagramView, DiffId, Fqn, ViewChange, ViewId } from '@likec4/core'
import type {
  ApplyEditsResult,
  LayoutView as LayoutViewProtocol,
  ModelEditRequest,
} from '@likec4/language-server/protocol'
import type { Location } from 'vscode-languageserver-types'
import type { CustomWrapperConfig } from './config'
import type { MonacoHandle } from './handle'

import { usePlayground, usePlaygroundSnapshot } from '$/hooks/usePlayground'
import { DRAWIO_EXPORT_EVENT } from '$components/drawio/drawio-events'
import * as monaco from '@codingame/monaco-vscode-editor-api'
import { invariant, nonNullable } from '@likec4/core'
import { LikeC4Model } from '@likec4/core/model'
import {
  ApplyModelEdit,
  BuildDocuments,
  ChangeView,
  DidChangeModelNotification,
  DidRequestRemovalImpactNotification,
  FetchComputedModel,
  FetchDiffs,
  FetchLayoutedModel,
  FetchRemovalImpact,
  LayoutCompareView,
  LayoutView,
  Locate,
  PreviewModelEdit,
  RollbackModelEdit,
} from '@likec4/language-server/protocol'
import { loggable, rootLogger } from '@likec4/log'
import { useCallbackRef } from '@mantine/hooks'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { funnel, isString } from 'remeda'
import { cleanDisposables, createMemoryFileSystem, ensureFileInWorkspace, setActiveEditor } from './utils'

const logger = rootLogger.getChild('monaco-language-client-sync')

function failedEdit(error: unknown): ApplyEditsResult {
  return { applied: false, remaining: [], error: loggable(error) }
}

/** Type-safe layout-view request: pass LayoutView.req so params and response are inferred. */
function requestLayoutView(
  client: {
    sendRequest(req: typeof LayoutView.req, params: LayoutViewProtocol.Params): Promise<LayoutViewProtocol.Res>
  },
  viewId: ViewId,
): Promise<LayoutViewProtocol.Res> {
  return client.sendRequest(LayoutView.req, { viewId })
}

/**
 * The language server registers its custom request handlers once the workspace is ready,
 * which may happen after the language client has started. Retry while the method is not available yet.
 */
async function requestBuildDocuments(
  client: { sendRequest(req: typeof BuildDocuments.req, params: { docs: string[] }): Promise<void> },
  docs: string[],
  attempts = 20,
): Promise<void> {
  for (let attempt = 1;; attempt++) {
    try {
      return await client.sendRequest(BuildDocuments.req, { docs })
    } catch (error) {
      if (attempt >= attempts || !String(error).includes('Unhandled method')) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

/**
 * Syncs playground state with the Monaco language client (active file, view, layout).
 * Sets layouted model API via setLayoutedModelApi when available; initializes and disposes LSP client.
 * @param config - Custom wrapper config for the editor.
 * @param wrapper - Handle to the started Monaco editor and language clients.
 * @param setLayoutedModelApi - Optional callback to receive the layouted model API (e.g. for Draw.io export).
 * @returns React component that provides the sync behavior.
 */
export function LanguageClientSync({
  config,
  wrapper,
  setLayoutedModelApi,
}: {
  config: CustomWrapperConfig
  wrapper: MonacoHandle
  setLayoutedModelApi?: (api: LayoutedModelApi | null) => void
}) {
  const router = useRouter()
  const playground = usePlayground()
  const {
    workspaceId,
    activeFilename,
    playgroundState,
    activeViewId,
    activeViewState,
    activeDiffId,
    likec4model,
  } = usePlaygroundSnapshot(s => ({
    workspaceId: s.context.workspaceId,
    activeFilename: s.context.activeFilename,
    playgroundState: s.value,
    activeViewId: s.context.activeViewId,
    activeViewState: s.context.activeViewId ? s.context.viewStates[s.context.activeViewId]?.state ?? 'pending' : null,
    activeDiffId: s.context.activeDiffId,
    likec4model: s.context.likec4model,
  }))
  // const requiresLspRestart = useRef(false)

  const languageClient = () =>
    nonNullable(
      wrapper.getLanguageClient('likec4'),
      'Monaco is missing LikeC4 LanguageClient',
    )

  const requestDiffs = useCallbackRef(async () => {
    try {
      const { diffs } = await languageClient().sendRequest(FetchDiffs.req, {})
      playground.send({ type: 'likec4.lsp.onDiffs', diffs })
    } catch (error) {
      logger.error(loggable(error))
    }
  })

  const requestComputedModel = useCallbackRef(async () => {
    try {
      const { model } = await languageClient().sendRequest(FetchComputedModel.req, { cleanCaches: false })
      if (model) {
        playground.send({
          type: 'likec4.lsp.onDidChangeModel',
          model: LikeC4Model.create(model),
        })
      }
      await requestDiffs()
    } catch (error) {
      logger.error(loggable(error))
    }
  })

  const requestCompareView = useCallbackRef(async (viewId: ViewId, diffId: DiffId) => {
    try {
      const { diagram } = await languageClient().sendRequest(LayoutCompareView.req, { viewId, diffId })
      playground.send({
        type: 'likec4.lsp.onCompareView',
        viewId,
        diffId,
        diagram,
        ...(!diagram && { error: 'The view does not exist in this model state' }),
      })
    } catch (error) {
      playground.send({ type: 'likec4.lsp.onCompareView', viewId, diffId, diagram: null, error: loggable(error) })
    }
  })

  const requestRemovalImpact = useCallbackRef(async (fqn: Fqn) => {
    try {
      const { report, diagram } = await languageClient().sendRequest(FetchRemovalImpact.req, { fqn })
      playground.send({
        type: 'likec4.lsp.onRemovalImpact',
        fqn,
        report,
        diagram,
        ...(!report && { error: `Element ${fqn} does not exist` }),
      })
    } catch (error) {
      playground.send({ type: 'likec4.lsp.onRemovalImpact', fqn, report: null, diagram: null, error: loggable(error) })
    }
  })

  const previewEdit = useCallbackRef(async (request: ModelEditRequest) => {
    try {
      const { preview, error } = await languageClient().sendRequest(PreviewModelEdit.req, { request })
      playground.send({ type: 'likec4.lsp.onEditPreview', request, preview, ...(error && { error }) })
    } catch (error) {
      playground.send({ type: 'likec4.lsp.onEditPreview', request, preview: null, error: loggable(error) })
    }
  })

  const applyEdit = useCallbackRef(async (request: ModelEditRequest, token: string) => {
    try {
      const result = await languageClient().sendRequest(ApplyModelEdit.req, { request, token })
      playground.send({ type: 'likec4.lsp.onEditApplied', request, result })
    } catch (error) {
      playground.send({ type: 'likec4.lsp.onEditApplied', request, result: failedEdit(error) })
    }
  })

  const rollbackEdit = useCallbackRef(async (editId: number) => {
    try {
      const result = await languageClient().sendRequest(RollbackModelEdit.req, { editId })
      playground.send({ type: 'likec4.lsp.onRollbackDone', result })
    } catch (error) {
      playground.send({ type: 'likec4.lsp.onRollbackDone', result: failedEdit(error) })
    }
  })

  const requestLayoutedData = useCallbackRef(async () => {
    try {
      const { model } = await languageClient().sendRequest(FetchLayoutedModel.req, {})
      if (model) {
        playground.send({ type: 'likec4.lsp.onLayoutedModel', model })
      } else {
        playground.send({ type: 'likec4.lsp.onLayoutedModelError', error: 'Failed to layout' })
      }
    } catch (err) {
      const error = loggable(err)
      playground.send({ type: 'likec4.lsp.onLayoutedModelError', error })
      logger.error(error)
    }
  })

  const registerLayoutedModelApi = useCallbackRef(() => {
    if (!setLayoutedModelApi || !wrapper) return
    const client = wrapper.getLanguageClient('likec4')
    if (!client) return
    setLayoutedModelApi({
      getLayoutedModel: async () => {
        const c = wrapper.getLanguageClient('likec4')
        if (!c) return null
        try {
          const { model } = await c.sendRequest(FetchLayoutedModel.req, {})
          return model ?? null
        } catch (err) {
          logger.warn(loggable(err))
          return null
        }
      },
      // Individual view layout failures are logged; returned Record omits failed views. Consider returning { results, errors } in a follow-up so export UI can report which views failed.
      layoutViews: async (viewIds: string[]) => {
        const c = wrapper.getLanguageClient('likec4')
        if (!c) return {}
        const out: Record<string, DiagramView> = {}
        await Promise.all(
          viewIds.map(async (viewId) => {
            try {
              const res = await requestLayoutView(c, viewId as ViewId)
              if (res.result?.diagram) out[viewId] = res.result.diagram
            } catch (err) {
              logger.warn(`layout view ${viewId} failed: ${loggable(err)}`)
            }
          }),
        )
        const failedCount = viewIds.length - Object.keys(out).length
        if (failedCount > 0) {
          logger.warn(`${failedCount}/${viewIds.length} views failed to layout`)
        }
        return out
      },
    })
  })

  const requestLayoutViewCallback = useCallbackRef(async (viewId: ViewId) => {
    try {
      const res = await requestLayoutView(languageClient(), viewId)
      const result = res.result
      if (result) {
        playground.send({ type: 'likec4.lsp.onLayoutDone', ...result })
      } else {
        playground.send({ type: 'likec4.lsp.onLayoutError', viewId, error: 'Layout failed' })
      }
    } catch (error) {
      playground.send({ type: 'likec4.lsp.onLayoutError', viewId, error: `${error}` })
      logger.error(loggable(error))
    }
  })

  const revealLocation = (location: Location) => {
    const editor = wrapper.getEditor()
    const model = monaco.editor.getModel(monaco.Uri.parse(location.uri))
    if (editor && model) {
      const range = new monaco.Range(
        location.range.start.line + 1,
        location.range.start.character + 1,
        location.range.end.line + 1,
        location.range.end.character + 1,
      )
      editor.setModel(model)
      editor.setSelection(range)
      editor.revealRangeInCenterIfOutsideViewport(range, monaco.editor.ScrollType.Smooth)
      const nextFilename = model.uri.path.slice(1)
      playground.changeActiveFile(nextFilename)
      return
    }
    console.error(`Editor or model not found for location`, { location, editor, model })
  }

  const showLocation = useCallbackRef(async (target: Locate.Params) => {
    try {
      const location = await languageClient().sendRequest(Locate.req, target)
      if (location) {
        revealLocation(location)
      }
    } catch (error) {
      console.error(error)
    }
  })

  const applyViewChanges = useCallbackRef(async (viewId: ViewId, change: ViewChange) => {
    try {
      if (change.op === 'save-view-snapshot' || change.op === 'reset-manual-layout') {
        console.warn(`Operation ${change.op} is ignored in Playground`)
        return
      }
      const res = await languageClient().sendRequest(ChangeView.req, { viewId, change })
      if (res.location) {
        revealLocation(res.location)
      }
    } catch (error) {
      playground.send({ type: 'likec4.lsp.onLayoutError', viewId, error: `${loggable(error)}` })
      console.error(error)
    }
  })

  const lastAsync = useRef(Promise.resolve())

  /**
   * Create memory file system and start language clients
   * If workspaceId changes, restart language client
   */
  useEffect(() => {
    const disposables = [] as IDisposable[]
    lastAsync.current = lastAsync.current
      .then(async () => {
        const ctx = playground.getContext()

        const clientWrapper = wrapper.getLanguageClientWrapper('likec4')
        invariant(clientWrapper, 'Monaco is missing LikeC4 LanguageClientWrapper')

        if (clientWrapper.isStarted()) {
          logger.debug`restart language client`
          await clientWrapper.restart()
        }

        logger.debug`initialize memory files`
        const { docs, activeModel } = createMemoryFileSystem(
          config.fsProvider,
          ctx.files,
          ctx.activeFilename,
        )
        if (activeModel) {
          wrapper.getEditor()?.setModel(activeModel)
        }

        const throttled = funnel(requestComputedModel, {
          triggerAt: 'end',
          maxBurstDurationMs: 300,
        })

        disposables.push(
          languageClient().onNotification(DidRequestRemovalImpactNotification.type, ({ fqn }) => {
            playground.send({ type: 'impact.open', fqn })
          }),
          languageClient().onNotification(DidChangeModelNotification.type, () => {
            try {
              const errors: string[] = []
              languageClient().diagnostics?.forEach((uri, diagnostics) => {
                for (const diagnostic of diagnostics) {
                  if (diagnostic.severity === 0) {
                    errors.push(
                      `L${diagnostic.range.start.line + 1}:${
                        diagnostic.range.start.character + 1
                      } ${diagnostic.message}`,
                    )
                  }
                }
              })
              playground.send({
                type: 'likec4.lsp.onDiagnostic',
                errors,
              })
            } catch (e) {
              logger.error(loggable(e))
            }
            throttled.call()
          }),
        )

        try {
          // Initial request for model
          await requestBuildDocuments(languageClient(), docs)
          await requestComputedModel()

          registerLayoutedModelApi()

          playground.send({
            type: 'workspace.ready',
          })
        }
        catch (err) {
          console.error(err)
        }
      })
      .catch(err => {
        logger.error(loggable(err))
      })
    return () => {
      setLayoutedModelApi?.(null)
      logger.debug`cleanDisposables`
      cleanDisposables(disposables)
    }
  }, [workspaceId, wrapper, setLayoutedModelApi, registerLayoutedModelApi])

  useEffect(() => {
    const subscribe = monaco.editor.registerCommand('likec4.open-preview', (_, viewId) => {
      if (isString(viewId)) {
        void router.navigate({
          from: '/w/$workspaceId/$viewId',
          to: './',
          params: {
            viewId,
          },
        })
        playground.changeActiveView(viewId as ViewId)
      }
    })
    return () => {
      subscribe.dispose()
    }
  }, [playground])

  useEffect(() => {
    const editor = wrapper.getEditor()
    if (!editor) return
    const disposables: IDisposable[] = [
      editor.addAction({
        id: 'likec4.drawio.export',
        label: 'Export to DrawIO',
        contextMenuGroupId: '9_cutcopypaste',
        contextMenuOrder: 101,
        run: () => {
          window.dispatchEvent(new CustomEvent(DRAWIO_EXPORT_EVENT))
        },
      }),
    ]
    return () => cleanDisposables(disposables)
  }, [wrapper, playgroundState])

  useEffect(
    () => {
      if (playgroundState !== 'ready') return
      const uri = monaco.Uri.file(activeFilename)
      let model = monaco.editor.getModel(uri)
      if (!model) {
        const ctx = playground.getContext()
        const content = ctx.files[activeFilename]
        if (content !== undefined) {
          model = ensureFileInWorkspace(config.fsProvider, activeFilename, content)
          const editor = wrapper.getEditor()
          if (editor) {
            editor.setModel(model)
          }
          const docs = Object.keys(ctx.files).map(f => monaco.Uri.file(f).toString())
          languageClient()
            .sendRequest(BuildDocuments.req, { docs })
            .then(() => requestComputedModel())
            .catch(err => logger.error(loggable(err)))
          return
        }
      }
      setActiveEditor(uri)
    },
    [activeFilename, playgroundState, config.fsProvider, wrapper, playground],
  )

  useEffect(
    () => {
      if (playgroundState !== 'ready' || activeViewId == null) return
      if (activeViewState === 'stale' || activeViewState === 'pending') {
        void requestLayoutViewCallback(activeViewId)
      }
    },
    [activeViewState, activeViewId, playgroundState],
  )

  // Compare view follows the active view, the active diff and model changes
  useEffect(
    () => {
      if (playgroundState !== 'ready' || !activeViewId || !activeDiffId) return
      void requestCompareView(activeViewId, activeDiffId)
    },
    [playgroundState, activeViewId, activeDiffId, likec4model],
  )

  // Refresh the removal impact report when the model changes
  useEffect(
    () => {
      const impact = playground.getContext().removalImpact
      if (impact?.state === 'ready') {
        void requestRemovalImpact(impact.fqn)
      }
    },
    [likec4model],
  )

  useEffect(() => {
    const listeners = [
      playground.actor.on('workspace.openSources', async ({ target }) => {
        await showLocation(target)
      }),
      playground.actor.on('workspace.revealLocation', ({ location }) => {
        revealLocation(location)
      }),
      playground.actor.on('workspace.request-removal-impact', async ({ fqn }) => {
        await requestRemovalImpact(fqn)
      }),
      playground.actor.on('workspace.preview-edit', async ({ request }) => {
        await previewEdit(request)
      }),
      playground.actor.on('workspace.apply-edit', async ({ request, token }) => {
        await applyEdit(request, token)
      }),
      playground.actor.on('workspace.rollback-edit', async ({ editId }) => {
        await rollbackEdit(editId)
      }),
      playground.actor.on('workspace.applyViewChanges', async ({ viewId, change }) => {
        await applyViewChanges(viewId, change)
      }),
      playground.actor.on('workspace.request-layouted-data', async () => {
        await requestLayoutedData()
      }),
    ]
    return () => listeners.forEach(l => l.unsubscribe())
  }, [playground])

  // Tracks all files, not only the active one: workspace edits from the language server change other files too
  useEffect(() => {
    if (playgroundState !== 'ready') return
    const disposables: IDisposable[] = []
    const track = (model: monaco.editor.ITextModel) => {
      disposables.push(model.onDidChangeContent(() => {
        playground.send({
          type: 'monaco.onTextChanged',
          filename: model.uri.path.slice(1),
          modified: model.getValue(),
        })
      }))
    }
    monaco.editor.getModels().forEach(track)
    disposables.push(monaco.editor.onDidCreateModel(track))
    return () => {
      cleanDisposables(disposables)
    }
  }, [wrapper, workspaceId, playgroundState, playground])

  return null
}
