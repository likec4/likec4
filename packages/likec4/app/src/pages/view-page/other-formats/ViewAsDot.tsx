import { Box, Code, Grid, ScrollArea } from '@radix-ui/themes'
import { dotSource, svgSource } from 'virtual:likec4/dot-sources'
import styles from '../view-page.module.css'

type ViewAsDotProps = {
  viewId: string
}

export default function ViewAsDot({ viewId }: ViewAsDotProps) {
  return (
    <Grid
      //@ts-expect-error TODO: fails on columns prop due to `exactOptionalPropertyTypes: true` in tsconfig
      columns='2'
      gap='2'
      shrink='1'
      grow='1'
    >
      <Box
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
    </Grid>
  )
}
