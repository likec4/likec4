import { Code, ScrollArea } from '@mantine/core'
import { useAsync } from '@react-hookz/web'
import { createFileRoute, createLazyFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { mmdSource } from 'virtual:likec4/mmd-sources'
import { CopyToClipboard } from '../components'

export const Route = createLazyFileRoute('/view/$viewId/mmd')({
  component: ViewAsMmd
})

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

function ViewAsMmd() {
  const { viewId } = Route.useRouteContext()
  const source = mmdSource(viewId)

  const [mmdSvg, { execute }] = useAsync(renderSvg, null)

  useEffect(() => {
    void execute(viewId, source)
  }, [source])

  return (
    <PanelGroup direction="horizontal" autoSaveId="viewAsMmd">
      <Panel>
        <ScrollArea>
          <Code block>
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
        <ScrollArea>
          {mmdSvg.result && <div dangerouslySetInnerHTML={{ __html: mmdSvg.result }}></div>}
        </ScrollArea>
      </Panel>
    </PanelGroup>
  )
}
