import { Box, Burger, Button, Code, ScrollArea } from '@mantine/core'
import { useAsync } from '@react-hookz/web'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { CopyToClipboard } from '../../components/CopyToClipboard'
import { SidebarDrawerOps } from '../../components/sidebar/state'
import { krokiD2SvgUrl } from '../../const'
import { svgContainer } from './view.css'
import * as styles from './view_viewId_.css'

export const Route = createFileRoute('/_single/view/$viewId/d2')({
  component: ViewAsD2,
  staleTime: Infinity,
  loader: async ({ context, params }) => {
    const projectId = context.projectId
    const { viewId } = params
    const { loadD2Sources } = await import('likec4:d2')
    try {
      const { d2Source } = await loadD2Sources(projectId)
      return {
        source: d2Source(viewId),
      }
    } catch (error) {
      console.error(error)
      throw notFound()
    }
  },
})

const fetchFromKroki = async (d2: string) => {
  const res = await fetch(krokiD2SvgUrl, {
    method: 'POST',
    cache: 'force-cache',
    body: JSON.stringify({
      diagram_source: d2,
      // diagram_options: {
      //   theme: 'colorblind-clear'
      // },
      output_format: 'svg',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return await res.text()
}

function ViewAsD2() {
  const { source } = Route.useLoaderData()
  const [krokiSvg, { execute }] = useAsync(fetchFromKroki, null)
  return (
    <>
      <Group
        className={styles.viewWithTopPadding}
        orientation="horizontal">
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
        <Separator
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
      </Group>
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
