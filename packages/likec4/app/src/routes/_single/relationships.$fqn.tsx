import type { Fqn } from '@likec4/core'
import { Box } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { useRelationshipsView } from './-useRelationshipsView'
import * as css from './view.css'

export const Route = createFileRoute('/_single/relationships/$fqn')({
  component: ViewLayout,
})

function ViewLayout() {
  const { fqn } = Route.useParams()
  const view = useRelationshipsView(fqn as Fqn)
  return (
    <>
      <Box className={css.cssViewOutlet}>
        {/* <BaseXYFlow /> */}
        {
          /* <LikeC4Diagram
          view={view}
          readonly
          zoomable
          pannable
          controls
          fitViewPadding={0.1}
          showDiagramTitle={false}
          showNavigationButtons={false}
          enableFocusMode={false}
          enableDynamicViewWalkthrough={false}
          enableElementDetails={false}
          enableRelationshipDetails={false}
          enableRelationshipBrowser={false}
          experimentalEdgeEditing={false}
          showNotations={false}
          nodesDraggable={false}
          nodesSelectable={false}
          renderIcon={RenderIcon}
          onNavigateTo={() => {}}
        /> */
        }
      </Box>
      {/* {!withOverviewGraph && <SidebarDrawer />} */}
    </>
  )
}

// function ViewHeader() {
//   const view = useLikeC4DiagramView(Route.useParams().viewId)
//   if (!view) {
//     return null
//   }
//   return <Header diagram={view} />
// }
