import { MonacoEditor } from '$/monaco'
import { Header } from '$components/appshell/Header'
import {
  type LayoutedModelApi,
  DrawioContextMenuProvider,
  useDrawioContextMenu,
} from '$components/drawio/DrawioContextMenuProvider'
import { WorkspaceFileTabs } from '$components/workspace/WorkspaceFileTabs'
import { PlaygroundActorContextProvider } from '$state/context'
import { WorkspacePersistence, WorkspaceSessionPersistence } from '$state/persistence'
import { css } from '@likec4/styles/css'
import { AppShell, AppShellHeader, AppShellMain, Box, Stack } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useState } from 'react'
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels'
import * as styles from '../styles.css'

export const Route = createFileRoute('/w/$workspaceId')({
  component: WorkspaceContextPage,
  loader: async ({ params }): Promise<{
    workspaceId: string
    activeFilename: string
    title: string
    files: Record<string, string>
  }> => {
    const { Examples } = await import('$/examples')
    const id = params.workspaceId as keyof typeof Examples
    const example = Examples[id]
    if (example) {
      return WorkspaceSessionPersistence.read(id) ?? {
        workspaceId: id,
        activeFilename: example.currentFilename,
        title: example.title,
        files: {
          ...example.files,
        },
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
  const [layoutedModelApi, setLayoutedModelApi] = useState<LayoutedModelApi | null>(null)

  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    groupId: 'likec4-playground',
    storage: sessionStorage,
  })

  return (
    <PlaygroundActorContextProvider workspace={workspace}>
      <DrawioContextMenuProvider layoutedModelApi={layoutedModelApi}>
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
                defaultSize={'60'}>
                <Stack h="100%" gap={0}>
                  <WorkspaceFileTabs />
                  <EditorPanelWithDrawioMenu setLayoutedModelApi={setLayoutedModelApi} />
                </Stack>
              </Panel>
              <Separator
                className={styles.resize}
                style={{
                  width: isMobile ? undefined : 5,
                  height: isMobile ? 5 : undefined,
                }} />
              <Panel id="preview" minSize={200} defaultSize={40} className={styles.panel}>
                <Outlet />
              </Panel>
            </Group>
          </AppShellMain>
        </AppShell>
      </DrawioContextMenuProvider>
    </PlaygroundActorContextProvider>
  )
}

function EditorPanelWithDrawioMenu({
  setLayoutedModelApi,
}: {
  setLayoutedModelApi: (api: LayoutedModelApi | null) => void
}) {
  const { openMenu } = useDrawioContextMenu()
  return (
    <Box
      flex={1}
      onContextMenu={e => {
        e.preventDefault()
        openMenu(e)
      }}
      style={{ minHeight: 0 }}>
      <MonacoEditor setLayoutedModelApi={setLayoutedModelApi} />
    </Box>
  )
}
