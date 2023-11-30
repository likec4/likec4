import { Box, Code, Flex, ScrollArea } from '@radix-ui/themes'
import { mmdSource } from 'virtual:likec4/mmd-sources'

type ViewAsMmdProps = {
  viewId: string
}

export default function ViewAsMmd({ viewId }: ViewAsMmdProps) {
  return (
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
  )
}
