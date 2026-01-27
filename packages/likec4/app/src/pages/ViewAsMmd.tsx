import { Box } from '@likec4/styles/jsx'
import { Code, ScrollArea } from '@mantine/core'
import { useAsync } from '@react-hookz/web'
import { useEffect } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { CopyToClipboard } from '../components/CopyToClipboard'
import * as styles from './styles.css'

const renderSvg = async (viewId: string, diagram: string) => {
  // @ts-ignore
  const { default: mermaid } = await import('https://cdn.jsdelivr.net/npm/mermaid@11.12/dist/mermaid.esm.min.mjs')
  mermaid.initialize({
    theme: 'dark',
  })
  const { svg } = await mermaid.render(viewId, diagram)
  return svg as string
}

export function ViewAsMmd({ viewId, mmdSource }: { viewId: string; mmdSource: string }) {
  const [mmdSvg, { execute }] = useAsync(renderSvg, null)

  useEffect(() => {
    void execute(viewId, mmdSource)
  }, [mmdSource])

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
              {mmdSource}
            </Code>
            <CopyToClipboard text={mmdSource} />
          </ScrollArea>
        </Panel>
        <Separator
          style={{
            width: 10,
          }} />
        <Panel>
          <ScrollArea h={'100%'}>
            {mmdSvg.result && (
              <Box className={styles.svgContainer} dangerouslySetInnerHTML={{ __html: mmdSvg.result }} />
            )}
          </ScrollArea>
        </Panel>
      </Group>
    </>
  )
}
