import { Examples } from '$/examples'
import { MonacoEditor } from '$/monaco'
import { Header } from '$components/appshell/Header'
import { WorkspaceFileTabs } from '$components/workspace/WorkspaceFileTabs'
import { PlaygroundActorContextProvider } from '$state/context'
import { WorkspacePersistence, WorkspaceSessionPersistence } from '$state/persistence'
import { css } from '@likec4/styles/css'
import { AppShell, AppShellHeader, AppShellMain, Box, Stack } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels'
import * as styles from '../styles.css'

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
        activeFilename: Examples[id].currentFilename!, // ! added by Gemini 5
        title: Examples[id].title,
        files: {
          ...Examples[id].files,
        },
      }
    }
    return WorkspacePersistence.read(id) ?? {
      workspaceId: id,
      activeFilename: Examples.blank.currentFilename!, // ! added by Gemini 5
      ...Examples.blank,
    }
  },
})

function WorkspaceContextPage() {
  // const { workspaceId } = Route.useParams()
  const workspace = Route.useLoaderData()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    groupId: 'likec4-playground',
    storage: sessionStorage,
  })

  return (
    <PlaygroundActorContextProvider workspace={workspace}>
      <AppShell header={{ height: 50 }}>
        <AppShellHeader>
          <Header />
        </AppShellHeader>
        <AppShellMain h={'100dvh'}>
          <Group
            className={css({ h: '100%' })}
            orientation={isMobile ? 'vertical' : 'horizontal'}
            defaultLayout={defaultLayout}
            onLayoutChange={onLayoutChange}>
            <Panel
              id="editor"
              className={styles.panel}
              collapsible={true}
              minSize={'10'}
              defaultSize={'40'}>
              <Stack h="100%" gap={0}>
                <WorkspaceFileTabs />
                <Box flex={1}>
                  <MonacoEditor />
                </Box>
              </Stack>
            </Panel>
            <Separator
              className={styles.resize}
              style={{
                width: isMobile ? undefined : 5,
                height: isMobile ? 5 : undefined,
              }} />
            <Panel id="preview" minSize={200} className={styles.panel}>
              <Outlet />
            </Panel>
          </Group>
        </AppShellMain>
      </AppShell>
    </PlaygroundActorContextProvider>
  )
}
