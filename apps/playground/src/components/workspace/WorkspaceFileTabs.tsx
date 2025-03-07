import { usePlayground, usePlaygroundContext, usePlaygroundWorkspace } from '$hooks/usePlayground'
import { css } from '$styled-system/css'
import { HStack, VStack } from '$styled-system/jsx'
import { HoverCard, Tabs, TabsList, Text, ThemeIcon } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'

export function WorkspaceFileTabs() {
  const playground = usePlayground()
  const { filenames, activeFilename } = usePlaygroundWorkspace()

  const diagnosticErrors = usePlaygroundContext(s => s.diagnosticErrors)

  return (
    <HStack className={css({})} justify={'space-between'}>
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
      {diagnosticErrors.length > 0 && (
        <HoverCard position="right-start">
          <HoverCard.Target>
            <ThemeIcon color="red" size={'sm'} radius={'sm'}>
              <IconAlertTriangle size={14} />
            </ThemeIcon>
          </HoverCard.Target>
          <HoverCard.Dropdown p={0}>
            <VStack bg={'red.6/20'} alignItems={'flex-start'} p="xs">
              {diagnosticErrors.map((error, i) => <Text component="div" c="red.7" key={i} fz="sm">{error}</Text>)}
            </VStack>
          </HoverCard.Dropdown>
        </HoverCard>
      )}
    </HStack>
  )
}
