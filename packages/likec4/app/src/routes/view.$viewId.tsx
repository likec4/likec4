import { Box, Burger } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useLikeC4View } from 'virtual:likec4'
import { SidebarDrawer } from '../components'
import { Header } from '../components/view-page/Header'

export const Route = createFileRoute('/view/$viewId')({
  beforeLoad: ({ params: { viewId } }) => ({
    viewId
  }),
  component: ViewLayout
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
        visibleFrom="lg"
        style={{
          position: 'absolute',
          top: 50,
          left: 0,
          width: 60,
          height: 'calc(100vh - 50px)',
          zIndex: 1
        }}>
      </Box>
      <Box
        visibleFrom="lg"
        style={{
          position: 'absolute',
          top: 50,
          right: 0,
          width: 60,
          height: 'calc(100vh - 50px)',
          zIndex: 1
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
  const view = useLikeC4View(Route.useRouteContext().viewId)
  if (!view) {
    return null
  }
  return <Header diagram={view} />
}
