import { Box, Burger, Button, Code, ScrollArea } from '@mantine/core'
import { useAsync } from '@react-hookz/web'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { CopyToClipboard } from '../../components/CopyToClipboard'
import { SidebarDrawerOps } from '../../components/sidebar/state'
import { krokiPumlSvgUrl } from '../../const'
import { svgContainer } from './view.css'
import * as styles from './view_viewId_.css'

export const Route = createFileRoute('/_single/view/$viewId/puml')({
  component: ViewAsPuml,
  staleTime: Infinity,
  loader: async ({ params, context }) => {
    const projectId = context.projectId
    const { viewId } = params
    const { loadPumlSources } = await import('likec4:puml')
    try {
      const { pumlSource } = await loadPumlSources(projectId)
      return {
        source: pumlSource(viewId),
      }
    } catch (error) {
      console.error(error)
      throw notFound()
    }
  },
})

const fetchFromKroki = async (puml: string) => {
  const res = await fetch(krokiPumlSvgUrl, {
    method: 'POST',
    cache: 'force-cache',
    body: JSON.stringify({
      diagram_source: puml,
      output_format: 'svg',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return await res.text()
}

function ViewAsPuml() {
  const { source } = Route.useLoaderData()
  const [krokiSvg, { execute }] = useAsync(fetchFromKroki, null)
  return (
    <>
      <PanelGroup className={styles.viewWithTopPadding} direction="horizontal" autoSaveId="viewAsPuml">
        <Panel>
          <ScrollArea
            className={styles.cssScrollArea}
            p={5}
            styles={{
              viewport: {
                borderRadius: 6,
              },
            }}>
            <Code block className={styles.cssCodeBlock}>
              {source}
            </Code>
            <CopyToClipboard text={source} />
          </ScrollArea>
        </Panel>
        <PanelResizeHandle
          style={{
            width: 10,
          }} />
        <Panel>
          <ScrollArea h={'100%'}>
            {krokiSvg.status !== 'success' && (
              <>
                <Button
                  mt={'xs'}
                  variant="light"
                  disabled={krokiSvg.status === 'loading'}
                  onClick={() => void execute(source)}>
                  {krokiSvg.status === 'loading' ? 'Loading...' : 'Render with Kroki'}
                </Button>
                {krokiSvg.status === 'error' && <Box>{krokiSvg.error?.message}</Box>}
              </>
            )}
            {krokiSvg.status === 'success' && (
              <Box className={svgContainer}>
                {!krokiSvg.result
                  ? <Box>Empty result</Box>
                  : <div dangerouslySetInnerHTML={{ __html: krokiSvg.result }}></div>}
              </Box>
            )}
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
