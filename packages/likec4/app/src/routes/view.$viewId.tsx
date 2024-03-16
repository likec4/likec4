import { Box, Burger } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import { DiagramNotFound, SidebarDrawer } from '../components'
import { Header } from '../components/view-page/Header'
import { selectLikeC4ViewAtom } from '../data/atoms'

export const Route = createFileRoute('/view/$viewId')({
  beforeLoad: ({ params: { viewId } }) => ({
    viewId,
    viewAtom: selectLikeC4ViewAtom(viewId)
  }),
  component: ViewLayout,
  notFoundComponent: (props) => {
    return <DiagramNotFound viewId={'asd'} />
  }
})

function ViewLayout() {
  // use disclosure
  const [opened, { toggle, close }] = useDisclosure(false)

  return (
    <>
      <Box
        style={{
          position: 'absolute',
          top: 50,
          left: 0,
          width: '100%',
          height: 'calc(100vh - 50px)'
        }}
      >
        <Outlet />
      </Box>
      {/* Handle back gesture */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 50,
          height: '100vh'
        }}>
      </Box>
      <ViewHeader />
      <SidebarDrawer opened={opened} onClose={close} />
      <Box
        style={{
          position: 'fixed',
          top: 10,
          left: 10
        }}>
        <Burger size={'sm'} opened={opened} onClick={toggle} aria-label="Toggle navigation" />
      </Box>
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
