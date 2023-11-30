import { Box, Code, ScrollArea } from '@radix-ui/themes'
import { d2Source } from 'virtual:likec4/d2-sources'

type ViewAsDotProps = {
  viewId: string
}

export default function ViewAsD2({ viewId }: ViewAsDotProps) {
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
          {d2Source(viewId)}
        </Code>
      </Box>
    </ScrollArea>
  )
}
