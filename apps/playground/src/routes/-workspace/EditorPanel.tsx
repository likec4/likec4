import { Box, Stack, Tabs } from '@mantine/core'
import { deepEqual } from 'fast-equals'
import { keys } from 'remeda'
import { useStoreApi, useWorkspaceState } from '../../state'
import { MonacoEditor } from './MonacoEditor'
import { SyncMonacoAndWorkspace } from './SyncMonacoAndWorkspace'

export function EditorPanel() {
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
    <Stack h={'100%'} gap={0}>
      {hasFiles && (
        <Box flex={0}>
          <Tabs
            style={{
              overflowX: 'scroll'
            }}
            value={current}
            onChange={v => v && store.setState({ currentFilename: v })}>
            <Tabs.List
              style={{
                flexWrap: 'nowrap'
              }}>
              {files.map(filename => (
                <Tabs.Tab key={filename} value={filename} fz={'xs'} fw={'500'}>
                  {filename}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </Box>
      )}
      <MonacoEditor />
      <SyncMonacoAndWorkspace />
    </Stack>
  )
}
