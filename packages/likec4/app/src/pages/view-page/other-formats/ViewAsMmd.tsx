import { Box, Code, Flex, ScrollArea } from '@radix-ui/themes'
import { useAsync } from '@react-hookz/web/esm'
import { useEffect } from 'react'
import { mmdSource } from 'virtual:likec4/mmd-sources'
import { CopyToClipboard } from '../../../components'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

type ViewAsMmdProps = {
  viewId: string
}

const renderSvg = async (viewId: string, diagram: string) => {
  const { default: mermaid } = await import(
    'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs'
  )
  mermaid.initialize({
    theme: 'dark'
  })
  const { svg } = await mermaid.render(viewId, diagram)
  return svg
}

export default function ViewAsMmd({ viewId }: ViewAsMmdProps) {
  const src = mmdSource(viewId)

  const [mmdSvg, { execute }] = useAsync(renderSvg, null)

  useEffect(() => {
    void execute(viewId, src)
  }, [src])

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
          {mmdSvg.result && (
            <Box grow={'1'} asChild position={'relative'} className={'svg-container'}>
              <div dangerouslySetInnerHTML={{ __html: mmdSvg.result }}></div>
            </Box>
          )}
        </ScrollArea>
      </Panel>
    </PanelGroup>
  )
}
