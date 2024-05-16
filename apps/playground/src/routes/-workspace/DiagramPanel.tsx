import { LikeC4Diagram } from '@likec4/diagram'
import { Box, LoadingOverlay, Text, Title } from '@mantine/core'
import { useStoreApi, useWorkspaceState, type WorkspaceState } from '../../state'
import * as css from './styles.css.ts'

const selector = (s: WorkspaceState) => {
  switch (true) {
    case !!s.diagram && !!s.computedView:
      return {
        state: 'ok' as const,
        diagram: s.diagram
      }
    case !s.initialized:
      return {
        state: 'initializing' as const,
        diagram: null
      }
    case !s.diagram && !s.computedView:
      return {
        state: 'no-views' as const,
        diagram: null
      }
    case !!s.diagram && !s.computedView && (!s.likeC4Model || !(s.diagram.id in s.likeC4Model.views)):
      return {
        state: 'removed' as const,
        diagram: s.diagram
      }
    case !!s.diagram && !s.computedView:
      return {
        state: 'compute-failed' as const,
        diagram: s.diagram
      }
    case !s.diagram && !!s.computedView:
      return {
        state: 'layout-failed' as const,
        diagram: null
      }
    default:
      return {
        state: 'unknown-error' as const,
        diagram: s.diagram
      }
  }
}

export function DiagramPanel() {
  const store = useStoreApi()
  const { state, diagram } = useWorkspaceState(selector)
  if (diagram) {
    return (
      <Box pos={'relative'} w={'100%'} h={'100%'}>
        <LikeC4Diagram
          view={diagram}
          readonly={false}
          fitView
          fitViewPadding={0.04}
          nodesDraggable={false}
          onNavigateTo={id => store.getState().fetchDiagram(id)}
          onChange={ev => store.getState().onChanges(ev)}
        />
        <Box className={css.diagramTitle}>
          <Text fz={10} fw={500} c={'dimmed'}>id: {diagram.id}</Text>
          <Title order={5}>
            {diagram.title}
          </Title>
        </Box>
      </Box>
    )
  }
  return (
    <Box pos={'relative'} w={'100%'} h={'100%'}>
      {state === 'initializing' && <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />}
      <Title order={4}>
        {state}
      </Title>
    </Box>
  )
}
