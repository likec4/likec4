import { Code, ScrollArea } from '@mantine/core'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { CopyToClipboard } from '../components'
import { svgContainer } from './view.css'
import { cssCodeBlock, cssScrollArea, viewWithTopPadding } from './view_viewId_.css'

export const Route = createFileRoute('/view/$viewId/dot')({
  component: ViewAsDot,
  loader: async ({ params }) => {
    const { viewId } = params
    try {
      const { dotSource, svgSource } = await import('virtual:likec4/dot-sources')
      const dot = dotSource(viewId)
      const dotSvg = svgSource(viewId)
      return {
        dot,
        dotSvg
      }
    } catch (error) {
      throw notFound()
    }
  }
})

function ViewAsDot() {
  const { dot, dotSvg } = Route.useLoaderData()
  return (
    <PanelGroup className={viewWithTopPadding} direction="horizontal" autoSaveId="viewAsDot">
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
