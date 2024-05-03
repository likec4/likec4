import { Alert, Box, Burger, Button, Code, Container } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { SidebarDrawer } from '../components/sidebar/Drawer'
import { Header } from '../components/view-page/Header'
import { useLikeC4View } from '../data'
import { cssCaptureGesturesLayer, cssViewOutlet } from './view.css'

export const Route = createFileRoute('/view/$viewId')({
  component: ViewLayout
})

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Container my={'md'}>
      <Alert variant="filled" color="red" title={'Something went wrong'}>
        <Code block color="red">
          {error.stack ?? error.message}
        </Code>
        <Button onClick={resetErrorBoundary} color="red" variant="white" mt={'lg'} size="xs">Try again</Button>
      </Alert>
    </Container>
  )
}

function ViewLayout() {
  // use disclosure
  const [opened, { toggle, close }] = useDisclosure(false)

  return (
    <>
      <Box className={cssViewOutlet}>
        <ErrorBoundary FallbackComponent={Fallback}>
          <Outlet />
        </ErrorBoundary>
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
