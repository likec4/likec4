import { Code, ScrollArea } from '@mantine/core'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { CopyToClipboard } from '../components/CopyToClipboard'
import * as styles from './styles.css'

export function ViewAsDot({ dot, dotSvg }: { dot: string; dotSvg: string }) {
  return (
    <>
      <Group className={styles.viewWithTopPadding}>
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
              {dot}
            </Code>
            <CopyToClipboard text={dot} />
          </ScrollArea>
        </Panel>
        <Separator
          style={{
            width: 10,
          }} />
        <Panel>
          <ScrollArea h={'100%'}>
            <div className={styles.svgContainer} dangerouslySetInnerHTML={{ __html: dotSvg }}></div>
          </ScrollArea>
        </Panel>
      </Group>
    </>
  )
}
