import { Code } from '@mantine/core'
import { useMediaQuery, useToggle } from '@mantine/hooks'
import { createFileRoute } from '@tanstack/react-router'
import { Examples } from '../examples'
// import { useWorkspaceState, WorkspaceContextProvider } from '../state'
// import { EditorPanel } from './-workspace/EditorPanel'
// import { Header } from './-workspace/Header'
// import { MonacoEditor } from '$/monaco'
// import { PlaygroundActorProvider } from '$state/context'
import { configureMonacoWorkers, loadLikeC4Worker } from '$/monaco/workers'
import { WorkspacePersistence, WorkspaceSessionPersistence } from '$state/persistence'
import { useEffect, useRef, useState } from 'react'

import type { PlaygroundInput } from '$state/playground-machine'
import * as monaco from '@codingame/monaco-vscode-editor-api'
import { invariant, LikeC4Model } from '@likec4/core'
import { FetchLayoutedModel, onDidChangeModel } from '@likec4/language-server/protocol'
import { useIsMounted } from '@react-hookz/web'
import { type WrapperConfig, MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper'
import { values } from 'remeda'
import type { BaseLanguageClient } from 'vscode-languageclient'

export const Route = createFileRoute('/explore/$workspaceId')({
  component: WorkspaceContextPage,
  loader: ({ params }): {
    workspaceId: string
    activeFilename: string
    title: string
    files: Record<string, string>
  } => {
    const id = params.workspaceId as keyof typeof Examples
    if (Examples[id]) {
      return WorkspaceSessionPersistence.read(id) ?? {
        workspaceId: id,
        activeFilename: Examples[id].currentFilename,
        title: Examples[id].title,
        files: Examples[id].files,
      }
    }
    return WorkspacePersistence.read(id) ?? {
      workspaceId: id,
      activeFilename: Examples.blank.currentFilename,
      ...Examples.blank,
    }
  },
})

async function init(htmlContainer: HTMLElement) {
  const wrapper = new MonacoEditorLanguageClientWrapper()
  const jsonClientUserConfig: WrapperConfig = {
    $type: 'extended',
    htmlContainer,
    vscodeApiConfig: {
      enableExtHostWorker: false,
      loadThemes: false,
    },
    editorAppConfig: {
      codeResources: {
        modified: {
          text: Examples.blank.files['blank.c4'],
          uri: 'file:///blank.c4',
        },
      },
      monacoWorkerFactory: configureMonacoWorkers,
    },
  }
  await wrapper.initAndStart(jsonClientUserConfig)
  // await initServices({
  //   enableExtHostWorker: false,
  //   loadThemes: false,
  // }, {
  //   htmlContainer,
  // })

  // // register the JSON language with Monaco
  // monaco.languages.register({
  //   id: 'likec4',
  //   extensions: ['.c4'],
  //   aliases: ['LikeC4'],
  // })

  // useWorkerFactory({
  //   workerLoaders: {
  //     // TextEditorWorker: () => new TextEditorWorker(),
  //   },
  // })

  // monaco.editor.create(htmlContainer, {
  //   value: Examples.blank.files['blank.c4'],
  //   language: 'likec4',
  // })

  // const worker = loadLikeC4Worker()

  // const messageTransports = {
  //   reader: new BrowserMessageReader(worker),
  //   writer: new BrowserMessageWriter(worker),
  // }

  // const client = new MonacoLanguageClient({
  //   name: 'Sample Language Client',
  //   clientOptions: {
  //     // use a language id as a document selector
  //     documentSelector: ['likec4'],
  //     // disable the default error handler
  //     errorHandler: {
  //       error: () => ({ action: ErrorAction.Continue }),
  //       closed: () => ({ action: CloseAction.DoNotRestart }),
  //     },
  //   },
  //   messageTransports,
  // })

  // await client.start()

  // return {
  //   client,
  //   worker,
  // }
  return wrapper
}

function waitForModelParsed(client: BaseLanguageClient) {
  return new Promise<void>((resolve) => {
    const l = client.onNotification(onDidChangeModel, () => {
      l.dispose()
      resolve()
    })
  })
}

function useInitialize(input: PlaygroundInput) {
  const isMounted = useIsMounted()
  const [stage, toggleStage] = useToggle(['loading', 'parsing', 'layouting', 'ready', 'error'] as const)
  const [model, setModel] = useState<LikeC4Model.Layouted | null>(null)

  useEffect(() => {
    let cancelled = false
    let htmlContainer = document.createElement('div')
    const wrapper = new MonacoEditorLanguageClientWrapper()
    let editorModel: monaco.editor.ITextModel | null = null

    const init = async () => {
      toggleStage('loading')
      await wrapper.init({
        $type: 'extended',
        htmlContainer,
        vscodeApiConfig: {
          enableExtHostWorker: false,
          loadThemes: false,
        },
        editorAppConfig: {
          codeResources: {
            modified: {
              text: values(input.files).join('\n'),
              uri: 'file:///blank.c4',
            },
          },
          monacoWorkerFactory: configureMonacoWorkers,
        },
        languageClientConfigs: {
          likec4: {
            name: 'likec4',
            clientOptions: {
              documentSelector: ['likec4'],
            },
            connection: {
              options: {
                $type: 'WorkerDirect',
                worker: loadLikeC4Worker(),
              },
            },
          },
        },
      })

      if (cancelled) return
      monaco.languages.register({
        id: 'likec4',
        extensions: ['.c4'],
      })

      await wrapper.start()
      if (cancelled) return

      const client = wrapper.getLanguageClient('likec4')
      if (!client) {
        throw new Error('LikeC4 LanguageClient is missing')
      }
      if (cancelled) return
      toggleStage('parsing')

      await waitForModelParsed(client)
      if (cancelled) return

      toggleStage('layouting')

      const { model } = await client.sendRequest(FetchLayoutedModel.Req)
      if (cancelled) return

      if (!model) {
        toggleStage('error')
        return
      }
      setModel(LikeC4Model.create(model))
      toggleStage('ready')
    }

    init().catch((e) => {
      console.error(e)
      if (!cancelled) {
        toggleStage('error')
      }
    })

    return () => {
      cancelled = true
      if (!wrapper.isStopping()) {
        wrapper.dispose()
      }
      htmlContainer.remove()
    }
  }, [])

  if (stage === 'ready') {
    invariant(model)
    return {
      stage,
      model,
    }
  }

  return {
    stage,
    model: null,
  }
}

function WorkspaceContextPage() {
  const container = useRef<HTMLDivElement>(null)
  // const { workspaceId } = Route.useParams()
  const workspace = Route.useLoaderData()

  const isMobile = useMediaQuery('(max-width: 768px)')

  const wrapperRef = useRef<MonacoEditorLanguageClientWrapper>(null)

  const { model, stage } = useInitialize(workspace)

  if (!model) {
    return <div>{stage}</div>
  }

  return <div>
    <Code block>{JSON.stringify(model.$model, null, 2)}</Code>
  </div>

  // return (
  //   <PlaygroundActorContextProvider workspace={workspace}>
  //     <AppShell header={{ height: 50 }}>
  //       <AppShellHeader>
  //         <Header />
  //       </AppShellHeader>
  //       <AppShellMain h={'100dvh'}>
  //         <PanelGroup
  //           direction={isMobile ? 'vertical' : 'horizontal'}
  //           autoSaveId={`playground`}>
  //           <Panel
  //             className={css.panel}
  //             collapsible={true}
  //             minSize={5}
  //             defaultSize={40}>
  //             <Stack h="100%" gap={0}>
  //               <WorkspaceFileTabs />
  //               <Box ref={container} flex={1} />
  //             </Stack>
  //           </Panel>
  //           <PanelResizeHandle
  //             className={css.resize}
  //             style={{
  //               padding: isMobile ? '1px 0' : '0 1px',
  //             }} />
  //           <Panel className={css.panel}>
  //             {/* <Outlet /> */}
  //           </Panel>
  //         </PanelGroup>
  //       </AppShellMain>
  //     </AppShell>
  //   </PlaygroundActorContextProvider>
  // )
}
