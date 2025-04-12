import { Button, Container, Stack, Text } from '@mantine/core'
import { createFileRoute, Link } from '@tanstack/react-router'
import { projects } from 'likec4:projects'

export const Route = createFileRoute('/projects')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Container size={'xs'} py={'lg'}>
      <Stack>
        <Text fz={'lg'}>Select a project</Text>
        {projects.map(v => (
          <Button
            key={v}
            variant="default"
            size="lg"
            fw={400}
            renderRoot={props => <Link {...props} to={`/project/$projectId/`} params={{ projectId: v }} />}
            styles={{
              inner: {
                justifyContent: 'flex-start',
              },
            }}>
            {v}
          </Button>
        ))}
      </Stack>
    </Container>
  )
}
