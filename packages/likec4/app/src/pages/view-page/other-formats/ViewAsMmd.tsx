import { Box, Code, Flex, ScrollArea } from '@radix-ui/themes'
import { useAsync } from '@react-hookz/web/esm'
import { useEffect } from 'react'
import { mmdSource } from 'virtual:likec4/mmd-sources'
import { CopyToClipboard } from '../../../components'

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
    <Flex
      gap='2'
      shrink='1'
      grow='1'
      align={'stretch'}
      wrap={'nowrap'}
      style={{
        overflow: 'hidden'
      }}
    >
      <Box
        py={'2'}
        position={'relative'}
        grow={'1'}
        style={{
          overflow: 'scroll'
        }}
      >
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
      </Box>
      <Box
        py={'2'}
        position={'relative'}
        grow={'1'}
        shrink={'0'}
        style={{
          minWidth: '50vw',
          overflow: 'scroll'
        }}
      >
        <ScrollArea scrollbars='both'>
          {mmdSvg.result && (
            <Box grow={'1'} asChild position={'relative'} className={'svg-container'}>
              <div dangerouslySetInnerHTML={{ __html: mmdSvg.result }}></div>
            </Box>
          )}
        </ScrollArea>
      </Box>
    </Flex>
  )
}
