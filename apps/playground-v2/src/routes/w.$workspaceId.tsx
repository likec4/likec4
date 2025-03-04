import { Examples } from '$/examples'
import { Header } from '$components/appshell/Header'
import { WorkspaceFileTabs } from '$components/workspace/WorkspaceFileTabs'
import { PlaygroundActorContextProvider } from '$state/context'
import { WorkspacePersistence, WorkspaceSessionPersistence } from '$state/persistence'
import { AppShell, AppShellHeader, AppShellMain, Button, Stack } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import * as css from './styles.css'

const MonacoEditor = lazy(() => import('$/monaco'))

export const Route = createFileRoute('/w/$workspaceId')({
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

function WorkspaceContextPage() {
  // const { workspaceId } = Route.useParams()
  const workspace = Route.useLoaderData()
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <PlaygroundActorContextProvider workspace={workspace}>
      <AppShell header={{ height: 50 }}>
        <AppShellHeader>
          <Header />
        </AppShellHeader>
        <AppShellMain h={'100dvh'}>
          <PanelGroup
            direction={isMobile ? 'vertical' : 'horizontal'}
            autoSaveId={`playground`}>
            <Panel
              className={css.panel}
              collapsible={true}
              minSize={5}
              defaultSize={40}>
              <Stack h="100%" gap={0}>
                <WorkspaceFileTabs />
                <Suspense fallback={<div>Loading...</div>}>
                  <MonacoEditor />
                </Suspense>
              </Stack>
            </Panel>
            <PanelResizeHandle
              className={css.resize}
              style={{
                padding: isMobile ? '1px 0' : '0 1px',
              }} />
            <Panel className={css.panel}>
              <Outlet />
            </Panel>
          </PanelGroup>
        </AppShellMain>
      </AppShell>
    </PlaygroundActorContextProvider>
  )
}
