import { useUpdateEffect } from '@likec4/diagram'
import { Alert, Button, Code, Container, Text } from '@mantine/core'
import { createFileRoute, isNotFound, Outlet, useRouter } from '@tanstack/react-router'
import { type FallbackProps } from 'react-error-boundary'
// import { useLikeC4Model } from 'likec4:model'
import { SidebarDrawer } from '../../components/sidebar/Drawer'
import { Header } from '../../components/view-page/Header'
import { withOverviewGraph } from '../../const'

export const Route = createFileRoute('/_single/view/$viewId')({
  component: ViewLayout,
  errorComponent: ({ error, reset }) => {
    return <Fallback error={error} resetErrorBoundary={reset} />
  },
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
                search: true,
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
  return (
    <>
      <Outlet />
      <Header />
      {!withOverviewGraph && <SidebarDrawer />}
    </>
  )
}
