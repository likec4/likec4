import { usePlayground, usePlaygroundWorkspace } from '$hooks/usePlayground'
import { Box, Tabs, TabsList } from '@mantine/core'

export function WorkspaceFileTabs() {
  const playground = usePlayground()
  const { filenames, activeFilename } = usePlaygroundWorkspace()
  if (filenames.length <= 1) {
    return null
  }
  return (
    <Box flex={0}>
      <Tabs
        style={{
          overflowX: 'scroll',
        }}
        value={activeFilename}
        onChange={v => {
          playground.changeActiveFile(v ?? playground.getActiveFile().filename)
        }}>
        <TabsList
          style={{
            flexWrap: 'nowrap',
          }}>
          {filenames.map(filename => (
            <Tabs.Tab key={filename} value={filename} fz={'xs'} fw={'500'}>
              {filename}
            </Tabs.Tab>
          ))}
        </TabsList>
      </Tabs>
    </Box>
  )
}
