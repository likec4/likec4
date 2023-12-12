import { Box, Code, Grid, ScrollArea } from '@radix-ui/themes'
import { dotSource, svgSource } from 'virtual:likec4/dot-sources'
import { CopyToClipboard } from '../../../components'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

type ViewAsDotProps = {
  viewId: string
}

export default function ViewAsDot({ viewId }: ViewAsDotProps) {
  const dot = dotSource(viewId)
  return (
    <PanelGroup direction='horizontal' autoSaveId='viewAsDot'>
      <Panel minSizePixels={100}>
        <ScrollArea scrollbars='both'>
          <Box
            asChild
            display={'block'}
            p='2'
            style={{
              whiteSpace: 'pre',
              minHeight: '100%'
            }}
          >
            <Code variant='soft' autoFocus>
              {dot}
            </Code>
          </Box>
          <CopyToClipboard text={dot} />
        </ScrollArea>
      </Panel>
      <PanelResizeHandle
        style={{
          width: 10
        }}
      />
      <Panel minSizePixels={100}>
        <ScrollArea scrollbars='both'>
          <Box
            py={'2'}
            style={{
              overflow: 'scroll',
              overscrollBehavior: 'none'
            }}
          >
            <Box asChild position={'relative'} className={'svg-container'}>
              <div dangerouslySetInnerHTML={{ __html: svgSource(viewId) }}></div>
            </Box>
          </Box>
        </ScrollArea>
      </Panel>
    </PanelGroup>
  )
}
