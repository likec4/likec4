import { Code, ScrollArea } from '@mantine/core'
import { createLazyFileRoute } from '@tanstack/react-router'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { d2Source } from 'virtual:likec4/d2-sources'
import { CopyToClipboard } from '../components'
import { cssCodeBlock, cssScrollArea } from './view_viewId_.css'

export const Route = createLazyFileRoute('/view/$viewId/d2')({
  component: ViewAsD2
})

function ViewAsD2() {
  const { viewId } = Route.useParams()
  const source = d2Source(viewId)
  return (
    <PanelGroup direction="horizontal" autoSaveId="viewAsD2">
      <Panel>
        <ScrollArea
          className={cssScrollArea}
          p={5}
          styles={{
            viewport: {
              borderRadius: 6
            }
          }}>
          <Code block className={cssCodeBlock}>
            {source}
          </Code>
          <CopyToClipboard text={source} />
        </ScrollArea>
      </Panel>
      <PanelResizeHandle
        style={{
          width: 10
        }}
      />
      <Panel>
        <ScrollArea h={'100%'}>
          {/* {mmdSvg.result && <div className={svgContainer}  dangerouslySetInnerHTML={{ __html: mmdSvg.result }}></div>} */}
        </ScrollArea>
      </Panel>
    </PanelGroup>
  )
}
