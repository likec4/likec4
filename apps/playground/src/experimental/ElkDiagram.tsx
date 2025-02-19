import { IconRenderer } from '$components/IconRenderer'
import type { ComputedView, DiagramView } from '@likec4/core'
import { type OnNavigateTo, LikeC4Diagram } from '@likec4/diagram'
import { useAsync } from '@react-hookz/web'
import { use, useMemo } from 'react'
import { applyElk } from './layout'

type ElkDiagramProps = {
  /**
   * Graphviz layouted diagram
   * Use as a dimension reference
   */
  diagram: DiagramView

  computed: ComputedView

  onNavigateTo?: OnNavigateTo | null | undefined
}
export function ElkDiagram({ diagram, onNavigateTo }: ElkDiagramProps) {
  // const layoutedDiagram =
  const [data, ops] = useAsync(applyElk, diagram)

  useMemo(() => {
    ops.execute(diagram)
  }, [diagram])

  return (
    <LikeC4Diagram
      view={data.result}
      readonly
      controls
      fitView
      fitViewPadding={0.07}
      experimentalEdgeEditing={false}
      nodesSelectable
      showNavigationButtons
      enableElementDetails={false}
      enableDynamicViewWalkthrough={false}
      enableRelationshipBrowser={false}
      enableRelationshipDetails={false}
      showNotations={false}
      enableFocusMode={false}
      enableSearch={false}
      renderIcon={IconRenderer}
      onNavigateTo={onNavigateTo}
    />
  )

  // return (
  //   <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
  //     <Suspense>
  //       <ElkLaoutedDiagram diagram={useDeferredValue(layoutedDiagram)} onNavigateTo={onNavigateTo} />
  //     </Suspense>
  //   </ErrorBoundary>
  // )
}

function ElkLaoutedDiagram({ diagram, onNavigateTo }: {
  diagram: Promise<DiagramView>
  onNavigateTo?: OnNavigateTo | null | undefined
}) {
  return (
    <LikeC4Diagram
      view={use(diagram)}
      readonly
      controls
      fitView
      fitViewPadding={0.07}
      experimentalEdgeEditing={false}
      nodesSelectable
      showNavigationButtons
      enableElementDetails={false}
      enableDynamicViewWalkthrough={false}
      enableRelationshipBrowser={false}
      enableRelationshipDetails={false}
      showNotations={false}
      enableFocusMode={false}
      enableSearch={false}
      renderIcon={IconRenderer}
      onNavigateTo={onNavigateTo}
    />
  )
}
