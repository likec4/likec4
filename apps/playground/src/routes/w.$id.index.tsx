import { Box, Stack, Tabs, TabsList, TabsTab } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { deepEqual } from 'fast-equals'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { keys } from 'remeda'
import { useStoreApi, useWorkspaceState } from '../state'
import { DiagramPanel } from './-workspace/DiagramPanel'
import { EditorPanel } from './-workspace/EditorPanel'
import * as css from './w.$id.css'

export const Route = createFileRoute('/w/$id/')({
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
                <Tabs
                  variant="outline"
                  style={{
                    overflowX: 'scroll'
                  }}
                  value={current}
                  onChange={v => v && store.setState({ currentFilename: v })}>
                  <TabsList
                    style={{
                      flexWrap: 'nowrap'
                    }}>
                    {files.map(filename => (
                      <TabsTab key={filename} value={filename} fz={'xs'} fw={'500'}>
                        {filename}
                      </TabsTab>
                    ))}
                  </TabsList>
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
    </>
  )
}
