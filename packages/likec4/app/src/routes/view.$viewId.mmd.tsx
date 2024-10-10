import { Box, Burger, Code, ScrollArea } from '@mantine/core'
import { useAsync } from '@react-hookz/web'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { CopyToClipboard } from '../components/CopyToClipboard'
import { SidebarDrawerOps } from '../components/sidebar/state'
import { svgContainer } from './view.css'
import { cssCodeBlock, cssScrollArea, viewWithTopPadding } from './view_viewId_.css'

export const Route = createFileRoute('/view/$viewId/mmd')({
  component: ViewAsMmd,
  loader: async ({ params }) => {
    const { viewId } = params
    try {
      const { mmdSource } = await import('./-view-lazy-data')
      return {
        source: mmdSource(viewId)
      }
    } catch (error) {
      throw notFound()
    }
  }
})

const renderSvg = async (viewId: string, diagram: string) => {
  const { default: mermaid } = await import(
    'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs'
  )
  mermaid.initialize({
    theme: 'dark'
  })
  const { svg } = await mermaid.render(viewId, diagram)
  return svg as string
}

function ViewAsMmd() {
  const { viewId } = Route.useParams()
  const { source } = Route.useLoaderData()

  const [mmdSvg, { execute }] = useAsync(renderSvg, null)

  useEffect(() => {
    void execute(viewId, source)
  }, [source])

  return (
    <>
      <PanelGroup className={viewWithTopPadding} direction="horizontal" autoSaveId="viewAsMmd">
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
            {mmdSvg.result && <div className={svgContainer} dangerouslySetInnerHTML={{ __html: mmdSvg.result }}></div>}
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
