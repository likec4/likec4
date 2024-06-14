import { AppShell, AppShellHeader, AppShellMain } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { BlankExample, Examples } from '../examples'
import { WorkspaceContextProvider } from '../state'
import { DiagramPanel } from './-workspace/DiagramPanel'
import { EditorPanel } from './-workspace/EditorPanel'
import { Header } from './-workspace/Header'
import * as css from './w.$id.css'

export const Route = createFileRoute('/w/$id')({
  component: WorkspaceContextPage,
  loader: ({ params }) => {
    const id = params.id as keyof typeof Examples
    return Examples[id] ?? {
      isCustom: true,
      ...BlankExample
    }
  }
})

export function WorkspaceContextPage() {
  const { id } = Route.useParams()
  const { isCustom, ...data } = Route.useLoaderData()

  return (
    <AppShell
      header={{ height: 50 }}
      // withBo rder={false}
    >
      <WorkspaceContextProvider key={id} name={id} {...data}>
        <AppShellHeader>
          <Header />
        </AppShellHeader>
        <AppShellMain h={'100dvh'}>
          <PanelGroup
            direction="horizontal"
            autoSaveId={`playground-${id}`}>
            <Panel
              collapsible={true}
              minSize={5}
              defaultSize={40}>
              <EditorPanel />
            </Panel>
            <PanelResizeHandle className={css.resize} />
            <Panel>
              <DiagramPanel />
            </Panel>
          </PanelGroup>
        </AppShellMain>
      </WorkspaceContextProvider>
    </AppShell>
  )
}
