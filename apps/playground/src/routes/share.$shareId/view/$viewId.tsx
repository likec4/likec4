import type { LocalWorkspace } from '#worker/types'
import { IconRenderer } from '$components/IconRenderer'
import { useWorkspaces } from '$hooks/useWorkspaces'
import type { DiagramView } from '@likec4/core'
import { LikeC4Diagram, useLikeC4Model } from '@likec4/diagram'
import { Box, HStack } from '@likec4/styles/jsx'
import { Alert, Button, Container } from '@mantine/core'
import { useCallbackRef } from '@mantine/hooks'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/share/$shareId/view/$viewId')({
  component: RouteComponent,
})

function useLikeC4DiagramView(viewId: string): DiagramView | null {
  const viewModel = useLikeC4Model().findView(viewId)
  if (!viewModel || !viewModel.isDiagram()) {
    return null
  }
  return viewModel.$view
}

function RouteComponent() {
  const navigate = useNavigate()
  const { viewId } = Route.useParams()
  const view = useLikeC4DiagramView(viewId)
  const sharedPlayground = Route.parentRoute.useLoaderData()

  const onNavigateTo = useCallbackRef((viewId: string) => {
    void navigate({
      to: './',
      params: { viewId },
      search: true,
      viewTransition: false,
    })
  })

  if (!view) {
    return (
      <Container size={'sm'} py="xl">
        <Alert title="Not Found" color="pink">
          View <code>{viewId}</code> not found.
        </Alert>
      </Container>
    )
  }

  const notations = view.notation?.nodes ?? []
  const hasNotations = notations.length > 0

  return (
    <>
      <LikeC4Diagram
        view={view}
        readonly
        zoomable
        pannable
        controls
        fitViewPadding={{
          top: 70,
          bottom: 32,
          left: 32,
          right: 32,
        }}
        showNavigationButtons
        enableFocusMode
        enableDynamicViewWalkthrough
        enableElementDetails
        enableRelationshipDetails
        enableRelationshipBrowser
        experimentalEdgeEditing={false}
        enableElementTags
        enableSearch
        showNotations={hasNotations}
        nodesDraggable={false}
        nodesSelectable
        renderIcon={IconRenderer}
        onNavigateTo={onNavigateTo}
      >
        {sharedPlayground.forkable && <ForkPlaygroundWorkspace workspace={sharedPlayground.localWorkspace} />}
      </LikeC4Diagram>
    </>
  )
}

const ForkPlaygroundWorkspace = ({ workspace: { workspaceId: _id, ...workspace } }: { workspace: LocalWorkspace }) => {
  const { shareId } = Route.useParams()
  const { expiresAt, author } = Route.parentRoute.useLoaderData()
  const [_, {
    createNew,
  }] = useWorkspaces()
  return (
    <Box className="react-flow__panel top right">
      <HStack gap="xs">
        <Button
          variant="default"
          size="xs"
          onClick={(e) => {
            e.stopPropagation()
            createNew({
              ...workspace,
              forkedFrom: {
                shareId,
                expiresAt,
                author,
              },
            })
          }}>
          Fork
        </Button>
      </HStack>
    </Box>
  )
}
