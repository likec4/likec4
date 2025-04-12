import { Alert, Box, Container } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/share/$shareId/not-found')({
  component: RouteComponent,
})

function RouteComponent() {
  const { shareId } = Route.useParams()
  return (
    <Container size={'sm'} py="xl">
      <Box>
        <Alert title="Not Found" color="pink">
          Playground <code>{shareId}</code> was not found or expired.
        </Alert>
      </Box>
    </Container>
  )
}
