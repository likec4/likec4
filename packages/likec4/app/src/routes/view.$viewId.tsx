import { Box, Burger } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SidebarDrawer } from '../components'
import { Header } from '../components/view-page/Header'
import { useLikeC4View } from '../data'
import { cssCaptureGesturesLayer, cssViewOutlet } from './view.css'

export const Route = createFileRoute('/view/$viewId')({
  component: ViewLayout
})

function ViewLayout() {
  // use disclosure
  const [opened, { toggle, close }] = useDisclosure(false)

  return (
    <>
      <Box className={cssViewOutlet}>
        <Outlet />
      </Box>
      {/* Handle back gesture */}
      <Box
        visibleFrom="lg"
        className={cssCaptureGesturesLayer}>
      </Box>
      <ViewHeader />
      <SidebarDrawer opened={opened} onClose={close} />
      <Box
        pos={'fixed'}
        top={10}
        left={10}>
        <Burger
          size={'sm'}
          opened={opened}
          onClick={toggle}
          aria-label="Toggle navigation" />
      </Box>
    </>
  )
}

function ViewHeader() {
  const view = useLikeC4View(Route.useParams().viewId)
  if (!view) {
    return null
  }
  return <Header diagram={view} />
}
