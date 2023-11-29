import { Box, Code, Flex, ScrollArea } from '@radix-ui/themes'
import { dotSource, svgSource } from 'virtual:likec4/dot-sources'
import styles from '../view-page.module.css'

type ViewAsDotProps = {
  viewId: string
}

export default function ViewAsDot({ viewId }: ViewAsDotProps) {
  return (
    <Flex
      grow={'1'}
      align={'stretch'}
      justify={'start'}
      direction={'row'}
      px={'2'}
      gap={'2'}
      style={{
        overflow: 'scroll'
      }}
    >
      <Box
        grow={'0'}
        shrink={'1'}
        py={'2'}
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
              {dotSource(viewId)}
            </Code>
          </Box>
        </ScrollArea>
      </Box>
      <Box
        grow={'1'}
        shrink={'1'}
        py={'2'}
        style={{
          overflow: 'scroll',
          overscrollBehavior: 'none'
        }}
      >
        <Box asChild position={'relative'} className={styles.dotSvg}>
          <div dangerouslySetInnerHTML={{ __html: svgSource(viewId) }}></div>
        </Box>
      </Box>
    </Flex>
  )
}
