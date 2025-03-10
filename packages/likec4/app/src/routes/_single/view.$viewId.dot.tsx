import { Box, Burger, Code, ScrollArea } from '@mantine/core'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { loadDotSources } from 'virtual:likec4/dot'
import { projectId } from 'virtual:likec4/single-project'
import { CopyToClipboard } from '../../components/CopyToClipboard'
import { SidebarDrawerOps } from '../../components/sidebar/state'
import * as css from './view.css'
import { cssCodeBlock, cssScrollArea, viewWithTopPadding } from './view_viewId_.css'

export const Route = createFileRoute('/_single/view/$viewId/dot')({
  component: ViewAsDot,
  loader: async ({ params }) => {
    const { viewId } = params
    try {
      const { dotSource, svgSource } = await loadDotSources(projectId)
      const dot = dotSource(viewId)
      const dotSvg = svgSource(viewId)
      return {
        dot,
        dotSvg,
      }
    } catch (error) {
      console.error(error)
      throw notFound()
    }
  },
})

function ViewAsDot() {
  const { dot, dotSvg } = Route.useLoaderData()
  return (
    <>
      <PanelGroup className={viewWithTopPadding} direction="horizontal" autoSaveId="viewAsDot">
        <Panel>
          <ScrollArea
            className={cssScrollArea}
            p={5}
            styles={{
              viewport: {
                borderRadius: 6,
              },
            }}>
            <Code block className={cssCodeBlock}>
              {dot}
            </Code>
            <CopyToClipboard text={dot} />
          </ScrollArea>
        </Panel>
        <PanelResizeHandle
          style={{
            width: 10,
          }} />
        <Panel>
          <ScrollArea h={'100%'}>
            <div className={css.svgContainer} dangerouslySetInnerHTML={{ __html: dotSvg }}></div>
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
