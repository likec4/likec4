import { Box, Burger, Code, ScrollArea } from '@mantine/core'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { CopyToClipboard } from '../components/CopyToClipboard'
import { SidebarDrawerOps } from '../components/sidebar/Drawer'
import { cssCodeBlock, cssScrollArea, viewWithTopPadding } from './view_viewId_.css'

export const Route = createFileRoute('/view/$viewId/d2')({
  component: ViewAsD2,
  loader: async ({ params }) => {
    const { viewId } = params
    try {
      const { d2Source } = await import('./-view-lazy-data')
      return {
        source: d2Source(viewId)
      }
    } catch (error) {
      throw notFound()
    }
  }
})

function ViewAsD2() {
  const { source } = Route.useLoaderData()
  return (
    <>
      <PanelGroup className={viewWithTopPadding} direction="horizontal" autoSaveId="viewAsD2">
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
          }} />
        <Panel>
          <ScrollArea h={'100%'}>
            {/* {mmdSvg.result && <div className={svgContainer}  dangerouslySetInnerHTML={{ __html: mmdSvg.result }}></div>} */}
          </ScrollArea>
        </Panel>
      </PanelGroup>
      <Box
        pos={'fixed'}
        top={14}
        left={10}>
        <Burger
          size={'sm'}
          onClick={SidebarDrawerOps.open}
          aria-label="Toggle navigation" />
      </Box>
    </>
  )
}
