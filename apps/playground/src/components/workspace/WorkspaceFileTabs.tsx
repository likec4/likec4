import { usePlayground, usePlaygroundWorkspace } from '$hooks/usePlayground'
import { Box, Tabs, TabsList } from '@mantine/core'

export function WorkspaceFileTabs() {
  const playground = usePlayground()
  const { filenames, activeFilename } = usePlaygroundWorkspace()
  return (
    <Box flex={'0 0 auto'}>
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
          {
            /* <Button
            size="compact-xs"
            color="gray"
            variant="subtle"
            className={css({
              alignSelf: 'center',
              fontWeight: 'medium',
              color: 'dimmed'
              // color: 'gray.7',
            })}>
            + add
          </Button> */
          }
        </TabsList>
      </Tabs>
    </Box>
  )
}
