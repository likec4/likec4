import { Box, Code, Flex, ScrollArea } from '@radix-ui/themes'
import { DotSource } from '~likec4-dot-sources'

type ViewAsDotProps = {
  viewId: string
}

export default function ViewAsDot({ viewId }: ViewAsDotProps) {
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
              <DotSource viewId={viewId} />
            </Code>
          </Box>
        </ScrollArea>
      </Box>
      <Box grow={'1'}>...</Box>
    </Flex>
  )
}
