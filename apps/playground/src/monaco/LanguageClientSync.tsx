import { usePlayground, usePlaygroundSnapshot } from '$/hooks/usePlayground'
import * as monaco from '@codingame/monaco-vscode-editor-api'
import { type IDisposable } from '@codingame/monaco-vscode-editor-api'
import { type ViewChange, type ViewId, invariant, LikeC4Model, nonNullable } from '@likec4/core'
import {
  type LocateParams,
  buildDocuments,
  changeView,
  fetchComputedModel,
  layoutView,
  locate,
  onDidChangeModel,
} from '@likec4/language-server/protocol'
import { loggable, rootLogger } from '@likec4/log'
import { useCallbackRef } from '@mantine/hooks'
import { useRouter } from '@tanstack/react-router'
import type { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper'
import { useEffect, useRef } from 'react'
import { funnel, isString } from 'remeda'
import { createMemoryFileSystem, loadLikeC4Worker, setActiveEditor } from './utils'

import type { Location } from 'vscode-languageserver-types'
import type { CustomWrapperConfig } from './config'

const logger = rootLogger.getChild('monaco-language-client-sync')

export function LanguageClientSync({ config, wrapper }: {
  config: CustomWrapperConfig
  wrapper: MonacoEditorLanguageClientWrapper
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
      const { model } = await languageClient().sendRequest(fetchComputedModel, {})
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

  const requestLayoutView = useCallbackRef(async (viewId: ViewId) => {
    try {
      const { result } = await languageClient().sendRequest(layoutView, { viewId })
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
    }
  }

  const showLocation = useCallbackRef(async (target: LocateParams) => {
    try {
      const location = await languageClient().sendRequest(locate, target)
      if (location) {
        revealLocation(location)
      }
    } catch (error) {
      logger.error(loggable(error))
    }
  })

  const applyViewChanges = useCallbackRef(async (viewId: ViewId, change: ViewChange) => {
    try {
      const location = await languageClient().sendRequest(changeView, { viewId, change })
      if (location) {
        revealLocation(location)
      }
    } catch (error) {
      playground.send({ type: 'likec4.lsp.onLayoutError', viewId, error: `${error}` })
      logger.error(loggable(error))
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
        logger.debug`initialize memory files`

        const clientWrapper = wrapper.getLanguageClientWrapper('likec4')
        invariant(clientWrapper, 'MonacoEditorLanguageClientWrapper is missing LikeC4 LanguageClientWrapper')

        const docs = createMemoryFileSystem(
          config.fsProvider,
          playground.getContext().files,
        )
        const activeFile = playground.getActiveFile()
        setActiveEditor(monaco.Uri.file(activeFile.filename))

        if (clientWrapper.isStarted()) {
          await clientWrapper.restartLanguageClient(loadLikeC4Worker())
        } else {
          await clientWrapper.start()
        }

        const throttled = funnel(requestComputedModel, {
          triggerAt: 'both',
          minGapMs: 1000,
        })

        disposables.push(
          languageClient().onNotification(onDidChangeModel, () => {
            throttled.call()
          }),
        )

        // Initial request for model
        await languageClient().sendRequest(buildDocuments, { docs })
        await requestComputedModel()

        playground.send({
          type: 'workspace.ready',
        })
      })
      .catch(err => {
        logger.error(loggable(err))
      })
  }, [workspaceId])

  useEffect(() => {
    const subscribe = monaco.editor.registerCommand('likec4.open-preview', (_, viewId) => {
      if (isString(viewId)) {
        router.navigate({
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
  }, [playground.actor])

  useEffect(
    () => {
      if (playgroundState !== 'ready') return
      setActiveEditor(monaco.Uri.file(activeFilename))
    },
    [activeFilename, playgroundState],
  )

  useEffect(
    () => {
      if (playgroundState !== 'ready' || activeViewId == null) return
      if (activeViewState === 'stale' || activeViewState === 'pending') {
        requestLayoutView(activeViewId)
      }
    },
    [activeViewState, activeViewId, playgroundState],
  )

  useEffect(() => {
    const listeners = [
      playground.actor.on('workspace.openSources', ({ target }) => {
        showLocation(target)
      }),
      playground.actor.on('workspace.applyViewChanges', ({ viewId, change }) => {
        applyViewChanges(viewId, change)
      }),
    ]
    return () => listeners.forEach(l => l.unsubscribe())
  }, [playground.actor])

  useEffect(() => {
    if (playgroundState !== 'ready') return
    const editor = nonNullable(wrapper.getEditor(), 'editor is not ready')
    const listener = editor.onDidChangeModelContent((contents) => {
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
  }, [wrapper, workspaceId, playgroundState, playground.actor])

  return null
}
