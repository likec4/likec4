import { Code, ScrollArea } from '@mantine/core'
import { createLazyFileRoute, notFound } from '@tanstack/react-router'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { dotSource, svgSource } from 'virtual:likec4/dot-sources'
import { CopyToClipboard, DiagramNotFound } from '../components'
import { svgContainer } from './view.css'
import { cssCodeBlock, cssScrollArea } from './view_viewId_.css'

export const Route = createLazyFileRoute('/view/$viewId/dot')({
  component: ViewAsDot
})

const useData = () => {
  const { viewId } = Route.useParams()
  try {
    return {
      dot: dotSource(viewId),
      dotSvg: svgSource(viewId)
    }
  } catch (error) {
    throw notFound()
  }
}

function ViewAsDot() {
  const { dot, dotSvg } = useData()
  return (
    <PanelGroup direction="horizontal" autoSaveId="viewAsDot">
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
          <div className={svgContainer} dangerouslySetInnerHTML={{ __html: dotSvg }}></div>
        </ScrollArea>
      </Panel>
    </PanelGroup>
  )
}
