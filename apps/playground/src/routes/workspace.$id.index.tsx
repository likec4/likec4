import { Box, Stack, Tabs } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { deepEqual } from 'fast-equals'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { keys } from 'remeda'
import { useStoreApi, useWorkspaceState } from '../state'
import { DiagramPanel } from './-workspace/DiagramPanel'
import { EditorPanel } from './-workspace/EditorPanel'
import { SyncMonacoAndWorkspace } from './-workspace/SyncMonacoAndWorkspace'
import * as css from './workspace.$id.css.ts'

export const Route = createFileRoute('/workspace/$id/')({
  component: WorkspacePage
})

export function WorkspacePage() {
  const { id } = Route.useParams()
  const store = useStoreApi()
  const {
    current,
    files
  } = useWorkspaceState(s => ({
    current: s.currentFilename,
    files: keys(s.files)
  }), deepEqual)

  const hasFiles = files.length > 1

  return (
    <>
      <PanelGroup
        direction="horizontal"
        autoSaveId={`playground-${id}`}>
        <Panel collapsible={true} minSize={10} defaultSize={40}>
          <Stack h={'100%'} gap={0}>
            {hasFiles && (
              <Box flex={0}>
                <Tabs variant="outline" value={current} onChange={v => v && store.setState({ currentFilename: v })}>
                  <Tabs.List>
                    {files.map(filename => (
                      <Tabs.Tab key={filename} value={filename} fz={'xs'} fw={'500'}>
                        {filename}
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs>
              </Box>
            )}
            <EditorPanel />
          </Stack>
        </Panel>
        <PanelResizeHandle className={css.resize} />
        <Panel>
          <DiagramPanel />
        </Panel>
      </PanelGroup>
      <SyncMonacoAndWorkspace />
    </>
  )
}
