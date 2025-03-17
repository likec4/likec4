import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SidebarDrawer } from '../../components/sidebar/Drawer'
import { Header } from '../../components/view-page/Header'
import { withOverviewGraph } from '../../const'
import { useCurrentDiagram } from '../../hooks'

export const Route = createFileRoute('/project/$projectId/view/$viewId')({
  component: ViewLayout,
})

function ViewLayout() {
  return (
    <>
      <Outlet />
      <ViewHeader />
      {!withOverviewGraph && <SidebarDrawer />}
    </>
  )
}

function ViewHeader() {
  const view = useCurrentDiagram()
  if (!view) {
    return null
  }
  return <Header diagram={view} />
}
