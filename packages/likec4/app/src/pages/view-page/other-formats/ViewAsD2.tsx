import { Box, Button, Code, Flex, ScrollArea } from '@radix-ui/themes'
import { useAsync } from '@react-hookz/web'
import { d2Source } from 'virtual:likec4/d2-sources'
import { CopyToClipboard } from '../../../components'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

type ViewAsDotProps = {
  viewId: string
}

const fetchFromKroki = async (d2: string) => {
  const res = await fetch('https://kroki.io/d2/svg', {
    method: 'POST',
    cache: 'force-cache',
    body: JSON.stringify({
      diagram_source: d2,
      // diagram_options: {
      //   theme: 'colorblind-clear'
      // },
      output_format: 'svg'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return await res.text()
}

export default function ViewAsD2({ viewId }: ViewAsDotProps) {
  const src = d2Source(viewId)

  const [krokiSvg, { execute }] = useAsync(fetchFromKroki, null)
  return (
    <PanelGroup direction='horizontal' autoSaveId='ViewAsD2'>
      <Panel minSizePixels={100}>
        <ScrollArea scrollbars='both'>
          <Box
            asChild
            display={'block'}
            p='2'
            style={{
              whiteSpace: 'pre',
              minHeight: '100%'
            }}
          >
            <Code variant='soft' autoFocus>
              {src}
            </Code>
          </Box>
          <CopyToClipboard text={src} />
        </ScrollArea>
      </Panel>
      <PanelResizeHandle
        style={{
          width: 10
        }}
      />
      <Panel minSizePixels={100}>
        <ScrollArea scrollbars='both'>
          {krokiSvg.status !== 'success' && (
            <>
              <Button disabled={krokiSvg.status === 'loading'} onClick={() => void execute(src)}>
                {krokiSvg.status === 'loading' ? 'Loading...' : 'Render with Kroki'}
              </Button>
              {krokiSvg.status === 'error' && <Box>{krokiSvg.error?.message}</Box>}
            </>
          )}
          {krokiSvg.status === 'success' && (
            <Box grow={'1'} asChild className={'svg-container'}>
              {!krokiSvg.result ? (
                <Box>Empty result</Box>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: krokiSvg.result }}></div>
              )}
            </Box>
          )}
        </ScrollArea>
      </Panel>
    </PanelGroup>
  )
}
