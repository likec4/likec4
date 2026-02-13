import { usePlayground, usePlaygroundSnapshot } from '$/hooks/usePlayground'
import { DRAWIO_EXPORT_EVENT } from '$components/drawio/drawio-events'
import type { LayoutedModelApi } from '$components/drawio/DrawioContextMenuProvider'
import type { IDisposable } from '@codingame/monaco-vscode-editor-api'
import * as monaco from '@codingame/monaco-vscode-editor-api'
import { type DiagramView, type ViewChange, type ViewId, invariant, nonNullable } from '@likec4/core'
import { LikeC4Model } from '@likec4/core/model'
import type { LayoutView as LayoutViewProtocol } from '@likec4/language-server/protocol'
import {
  BuildDocuments,
  ChangeView,
  DidChangeModelNotification,
  FetchComputedModel,
  FetchLayoutedModel,
  LayoutView,
  Locate,
} from '@likec4/language-server/protocol'
import { loggable, rootLogger } from '@likec4/log'
import { useCallbackRef } from '@mantine/hooks'
import { useRouter } from '@tanstack/react-router'
import type { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper'
import { useEffect, useRef } from 'react'
import { funnel, isString } from 'remeda'
import { type CustomWrapperConfig, loadLikeC4Worker } from './config'
import { cleanDisposables, createMemoryFileSystem, ensureFileInWorkspace, setActiveEditor } from './utils'

import type { Location } from 'vscode-languageserver-types'

const logger = rootLogger.getChild('monaco-language-client-sync')

export function LanguageClientSync({
  config,
  wrapper,
  setLayoutedModelApi,
}: {
  config: CustomWrapperConfig
  wrapper: MonacoEditorLanguageClientWrapper
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
  } = usePlaygroundSnapshot(s => ({
    workspaceId: s.context.workspaceId,
    activeFilename: s.context.activeFilename,
    playgroundState: s.value,
    activeViewId: s.context.activeViewId,
    activeViewState: s.context.activeViewId ? s.context.viewStates[s.context.activeViewId]?.state ?? 'pending' : null,
  }))
  // const requiresLspRestart = useRef(false)

  const languageClient = () =>
    nonNullable(
      wrapper.getLanguageClient('likec4'),
      'MonacoEditorLanguageClientWrapper is missing LikeC4 LanguageClient',
    )

  const requestComputedModel = useCallbackRef(async () => {
    try {
      const { model } = await languageClient().sendRequest(FetchComputedModel.req, { cleanCaches: false })
      if (model) {
        playground.send({
          type: 'likec4.lsp.onDidChangeModel',
          model: LikeC4Model.create(model),
        })
      }
    } catch (error) {
      logger.error(loggable(error))
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
        } catch {
          return null
        }
      },
      layoutViews: async (viewIds: string[]) => {
        const c = wrapper.getLanguageClient('likec4')
        if (!c) return {}
        const out: Record<string, DiagramView> = {}
        await Promise.all(
          viewIds.map(async (viewId) => {
            try {
              const res = (await c.sendRequest(LayoutView.req.method, {
                viewId,
              })) as LayoutViewProtocol.Res
              if (res.result?.diagram) out[viewId] = res.result.diagram
            } catch {
              // skip failed view
            }
          }),
        )
        return out
      },
    })
  })

  const requestLayoutView = useCallbackRef(async (viewId: ViewId) => {
    try {
      const res = (await languageClient().sendRequest(LayoutView.req.method, {
        viewId,
      })) as LayoutViewProtocol.Res
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
        invariant(clientWrapper, 'MonacoEditorLanguageClientWrapper is missing LikeC4 LanguageClientWrapper')

        if (clientWrapper.isStarted()) {
          logger.debug`restart language client`
          await clientWrapper.restartLanguageClient(loadLikeC4Worker())
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
          await languageClient().sendRequest(BuildDocuments.req, { docs })
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
        requestLayoutView(activeViewId).catch(error => {
          logger.error(loggable(error))
        })
      }
    },
    [activeViewState, activeViewId, playgroundState],
  )

  useEffect(() => {
    const listeners = [
      playground.actor.on('workspace.openSources', async ({ target }) => {
        await showLocation(target)
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

  useEffect(() => {
    if (playgroundState !== 'ready') return
    const editor = nonNullable(wrapper.getEditor(), 'editor is not ready')
    const listener = editor.onDidChangeModelContent((_contents) => {
      const activeModel = nonNullable(editor.getModel(), 'active model is not ready')
      const filename = activeModel.uri.path.slice(1)
      playground.send({
        type: 'monaco.onTextChanged',
        filename,
        modified: activeModel.getValue(),
      })
    })
    return () => {
      listener.dispose()
    }
  }, [wrapper, workspaceId, playgroundState, playground])

  return null
}
