import type { LocalWorkspace } from '#worker/types'
import { IconRenderer } from '$components/IconRenderer'
import { Logo } from '$components/Logo'
import { useWorkspaces } from '$hooks/useWorkspaces'
import { css } from '$styled-system/css'
import { Box, HStack, VStack } from '$styled-system/jsx'
import type { ViewId } from '@likec4/core'
import { type ControlsCustomLayout, LikeC4Diagram, useLikeC4Model } from '@likec4/diagram'
import { Button, UnstyledButton } from '@mantine/core'
import { useCallbackRef } from '@mantine/hooks'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { m } from 'framer-motion'

export const Route = createFileRoute('/share/$shareId/_layout/view/$viewId')({
  component: RouteComponent,
})

function useLikeC4DiagramView(viewId: string) {
  return useLikeC4Model(true, 'layouted').findView(viewId)?.$view ?? null
}

function RouteComponent() {
  const router = useRouter()
  const { viewId, shareId } = Route.useParams()
  const view = useLikeC4DiagramView(viewId)
  const sharedPlayground = Route.parentRoute.useLoaderData()

  const onNavigateTo = useCallbackRef((viewId: ViewId) => {
    router.navigate({
      to: '/share/$shareId/view/$viewId/',
      params: { shareId, viewId },
      search: true,
    })
  })

  if (!view) {
    throw notFound()
  }

  const notations = view.notation?.elements ?? []
  const hasNotations = notations.length > 0

  return (
    <>
      <LikeC4Diagram
        view={view}
        readonly
        zoomable
        pannable
        controls={false}
        fitViewPadding={0.12}
        showDiagramTitle
        showNavigationButtons
        enableFocusMode
        enableDynamicViewWalkthrough
        enableElementDetails
        enableRelationshipDetails
        enableRelationshipBrowser
        experimentalEdgeEditing={false}
        showNotations={hasNotations}
        nodesDraggable={false}
        nodesSelectable
        renderIcon={IconRenderer}
        renderControls={ControlsLayout}
        onNavigateTo={onNavigateTo}
        onBurgerMenuClick={() => ({})}
      >
        {sharedPlayground.forkable && <ForkPlaygroundWorkspace workspace={sharedPlayground.localWorkspace} />}
      </LikeC4Diagram>
    </>
  )
}

const ControlsLayout: ControlsCustomLayout = ({
  actionsGroup,
  navigationButtons,
  burgerMenu,
  search,
}) => (
  <m.div
    initial={{
      opacity: 0.05,
      translateY: '-50%',
    }}
    animate={{
      opacity: 1,
      translateY: 0,
    }}
    exit={{
      opacity: 0.05,
      translateY: '-50%',
    }}
    className="react-flow__panel top left"
  >
    <VStack gap="lg">
      <HStack gap="md">
        {/* {burgerMenu} */}
        <UnstyledButton
          component="a"
          href="https://likec4.dev/"
          target="_blank"
          className={css({
            px: 'sm',
          })}>
          <Logo width={100} />
        </UnstyledButton>
        <HStack gap="2xs">
          {navigationButtons}
        </HStack>
        <Box w={250} maxW={300}>
          {search}
        </Box>
      </HStack>
      {actionsGroup}
    </VStack>
  </m.div>
)

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
