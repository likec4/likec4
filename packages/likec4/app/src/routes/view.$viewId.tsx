import { useUpdateEffect } from '@likec4/diagram'
import { Alert, Box, Burger, Button, Code, Container, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { createFileRoute, isNotFound, Outlet, useRouter } from '@tanstack/react-router'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { useLikeC4View } from 'virtual:likec4/store'
import { SidebarDrawer } from '../components/sidebar/Drawer'
import { Header } from '../components/view-page/Header'
import * as css from './view.css'

export const Route = createFileRoute('/view/$viewId')({
  component: ViewLayout
})

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const router = useRouter()
  const { viewId } = Route.useParams()

  useUpdateEffect(() => {
    resetErrorBoundary()
  }, [viewId])

  if (isNotFound(error)) {
    return (
      <Container my={'md'}>
        <Alert variant="light" color="orange">
          <Text c={'orange'} fz={'md'}>
            The diagram{' '}
            <Code color="orange">
              {viewId}
            </Code>{' '}
            does not exist or contains errors
          </Text>
          <Button
            onClick={() => {
              resetErrorBoundary()
              router.navigate({
                to: '/',
                search: true
              })
            }}
            variant="light"
            color="orange"
            mt={'lg'}
            size="xs">
            Go to overview
          </Button>
        </Alert>
      </Container>
    )
  }
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
      <Box className={css.cssViewOutlet}>
        <ErrorBoundary FallbackComponent={Fallback}>
          <Outlet />
        </ErrorBoundary>
      </Box>
      <ViewHeader />
      <SidebarDrawer opened={opened} onClose={close} />
      <Box
        pos={'fixed'}
        top={14}
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
