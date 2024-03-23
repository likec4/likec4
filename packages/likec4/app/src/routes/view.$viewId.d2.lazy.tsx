import { Code, ScrollArea } from '@mantine/core'
import { createLazyFileRoute } from '@tanstack/react-router'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { d2Source } from 'virtual:likec4/d2-sources'
import { CopyToClipboard } from '../components'

export const Route = createLazyFileRoute('/view/$viewId/d2')({
  component: ViewAsD2
})

function ViewAsD2() {
  const { viewId } = Route.useRouteContext()
  const source = d2Source(viewId)
  return (
    <PanelGroup direction="horizontal" autoSaveId="viewAsD2">
      <Panel>
        <ScrollArea
          h={'100%'}
          p={4}
          styles={{
            root: {
              borderRadius: 6
            },
            viewport: {
              borderRadius: 6
            }
          }}>
          <Code block>
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
