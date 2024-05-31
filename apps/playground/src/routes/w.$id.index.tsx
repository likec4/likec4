import { Box, Stack, Tabs, TabsList, TabsTab } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { deepEqual } from 'fast-equals'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { keys } from 'remeda'
import { useStoreApi, useWorkspaceState } from '../state'
import { DiagramPanel } from './-workspace/DiagramPanel'
import { EditorPanel } from './-workspace/EditorPanel'
import * as css from './w.$id.css'

export const Route = createFileRoute('/w/$id/')({
  component: WorkspacePage
})

export function WorkspacePage() {
  const { id } = Route.useParams()
  return (
    <>
      <PanelGroup
        direction="horizontal"
        autoSaveId={`playground-${id}`}>
        <Panel
          collapsible={true}
          minSize={5}
          defaultSize={40}>
          <EditorPanel />
        </Panel>
        <PanelResizeHandle className={css.resize} />
        <Panel>
          <DiagramPanel />
        </Panel>
      </PanelGroup>
    </>
  )
}
