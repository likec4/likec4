import { Code, ScrollArea } from '@mantine/core'
import { createLazyFileRoute } from '@tanstack/react-router'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { dotSource, svgSource } from 'virtual:likec4/dot-sources'
import { CopyToClipboard } from '../components'
import { svgContainer } from './view.css'

export const Route = createLazyFileRoute('/view/$viewId/dot')({
  component: ViewAsDot
})

function ViewAsDot() {
  const { viewId } = Route.useParams()
  const dot = dotSource(viewId)
  return (
    <PanelGroup direction="horizontal" autoSaveId="viewAsDot">
      <Panel>
        <ScrollArea
          h={'100%'}
          p={5}
          styles={{
            viewport: {
              borderRadius: 6
            }
          }}>
          <Code block>
            {dot}
          </Code>
          <CopyToClipboard text={dot} />
        </ScrollArea>
      </Panel>
      <PanelResizeHandle
        style={{
          width: 10
        }}
      />
      <Panel>
        <ScrollArea h={'100%'}>
          <div className={svgContainer} dangerouslySetInnerHTML={{ __html: svgSource(viewId) }}></div>
        </ScrollArea>
      </Panel>
    </PanelGroup>
  )
}
