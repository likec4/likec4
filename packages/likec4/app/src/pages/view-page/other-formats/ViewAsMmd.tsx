import { Box, Code, Flex, ScrollArea } from '@radix-ui/themes'
import { mmdSource } from 'virtual:likec4/mmd-sources'

type ViewAsMmdProps = {
  viewId: string
}

export default function ViewAsMmd({ viewId }: ViewAsMmdProps) {
  return (
    <Flex align={'stretch'} direction={'row'} px={'2'}>
      <Box
        grow={'1'}
        shrink={'1'}
        py={'3'}
        style={{
          overflow: 'scroll'
        }}
      >
        <ScrollArea scrollbars='both'>
          <Box
            asChild
            display={'block'}
            p='2'
            style={{
              whiteSpace: 'pre'
            }}
          >
            <Code variant='soft' autoFocus>
              {mmdSource(viewId)}
            </Code>
          </Box>
        </ScrollArea>
      </Box>
      <Box grow={'1'}>...</Box>
    </Flex>
  )
}
