import { Box, Code, ScrollArea } from '@radix-ui/themes'
import { mmdSource } from 'virtual:likec4/mmd-sources'
import { CopyToClipboard } from '../../../components'

type ViewAsMmdProps = {
  viewId: string
}

export default function ViewAsMmd({ viewId }: ViewAsMmdProps) {
  const src = mmdSource(viewId)
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
