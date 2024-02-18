import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import { Sidebar } from '../components'
import { Header } from '../components/view-page/Header'
import { selectLikeC4ViewAtom } from '../data/atoms'

export const Route = createFileRoute('/view/$viewId')({
  beforeLoad: ({ params: { viewId } }) => ({
    viewId,
    viewAtom: selectLikeC4ViewAtom(viewId)
  }),
  component: ViewLayout
})

function ViewLayout() {
  return (
    <>
      <Outlet />
      <ViewHeader />
      <Sidebar />
    </>
  )
}

function ViewHeader() {
  const view = useAtomValue(Route.useRouteContext().viewAtom)
  if (!view) {
    return null
  }
  return <Header diagram={view} />
}
