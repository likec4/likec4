import { Box, Code, ScrollArea } from '@radix-ui/themes'
import { d2Source } from 'virtual:likec4/d2-sources'
import { CopyToClipboard } from '../../../components'

type ViewAsDotProps = {
  viewId: string
}

export default function ViewAsD2({ viewId }: ViewAsDotProps) {
  const src = d2Source(viewId)
  return (
    <>
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
            {src}
          </Code>
        </Box>
      </ScrollArea>
      <CopyToClipboard text={src} />
    </>
  )
}
