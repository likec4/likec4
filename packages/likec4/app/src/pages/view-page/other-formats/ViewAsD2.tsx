import { Box, Code, Flex, ScrollArea } from '@radix-ui/themes'
import { D2Source } from '~likec4-d2-sources'

type ViewAsDotProps = {
  viewId: string
}

export default function ViewAsD2({ viewId }: ViewAsDotProps) {
  return (
    <Flex position={'fixed'} inset='0' pt={'8'} align={'stretch'} direction={'row'} px={'2'}>
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
              <D2Source viewId={viewId} />
            </Code>
          </Box>
        </ScrollArea>
      </Box>
      <Box grow={'1'}>...</Box>
    </Flex>
  )
}
