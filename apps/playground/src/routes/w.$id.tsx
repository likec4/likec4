import { AppShell, AppShellHeader, AppShellMain } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
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
      title: `Blank - ${id}`,
      ...BlankExample
    }
  }
})

export function WorkspaceContextPage() {
  const { id } = Route.useParams()
  const { isCustom, ...data } = Route.useLoaderData()
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <AppShell header={{ height: 50 }}>
      <WorkspaceContextProvider
        key={id}
        name={id}
        skipHydration={!isCustom}
        {...data}
      >
        <AppShellHeader>
          <Header />
        </AppShellHeader>
        <AppShellMain h={'100dvh'}>
          <PanelGroup
            direction={isMobile ? 'vertical' : 'horizontal'}
            autoSaveId={`playground-${id}`}>
            <Panel
              className={css.panel}
              collapsible={true}
              minSize={5}
              defaultSize={40}>
              <EditorPanel />
            </Panel>
            <PanelResizeHandle
              className={css.resize}
              style={{
                padding: isMobile ? '1px 0' : '0 1px'
              }} />
            <Panel className={css.panel}>
              <DiagramPanel />
            </Panel>
          </PanelGroup>
        </AppShellMain>
      </WorkspaceContextProvider>
    </AppShell>
  )
}
