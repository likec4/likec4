import { extractStep, isStepEdgeId, type ViewID } from '@likec4/core'
import {
  ActionIcon,
  Box,
  type BoxProps,
  Button,
  CloseButton,
  Group,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  ScrollAreaAutosize,
  Stack,
  Text
} from '@mantine/core'
import { useDebouncedEffect } from '@react-hookz/web'
import { IconZoomScan } from '@tabler/icons-react'
import { EdgeLabelRenderer } from '@xyflow/react'
import clsx from 'clsx'
import { type PropsWithChildren, type ReactNode, useState } from 'react'
import { isTruthy } from 'remeda'
import { useDiagramState, useDiagramStoreApi, useMantinePortalProps } from '../../hooks'
import { useLikeC4Model } from '../../likec4model/useLikeC4Model'
import type { RelationshipData } from '../types'
import * as edgesCss from './edges.css'
import { RelationshipsDropdownMenu } from './RelationshipsDropdownMenu'

export interface EdgeLabelProps extends Omit<BoxProps, 'label'> {
  isDimmed: boolean
  edgeData: RelationshipData
}

export const EdgeLabel = ({
  isDimmed,
  edgeData: {
    label,
    edge
  },
  ...props
}: EdgeLabelProps) => {
  const likec4model = useLikeC4Model()
  const {
    showRelationshipDetails,
    isActiveWalkthroughStep,
    hasOnNavigateTo
  } = useDiagramState(s => ({
    showRelationshipDetails: s.showRelationshipDetails,
    isActiveWalkthroughStep: s.activeWalkthrough?.stepId === edge.id,
    hasOnNavigateTo: !!s.onNavigateTo
  }))
  const notes = isActiveWalkthroughStep ? (edge.notes ?? null) : null
  const stepNum = isStepEdgeId(edge.id) ? extractStep(edge.id) : null
  const navigateTo = hasOnNavigateTo ? edge.navigateTo ?? null : null

  const wrapWithPopover = (node: ReactNode) => {
    if (isTruthy(notes)) {
      return <NotePopover notes={notes}>{node}</NotePopover>
    }
    if (showRelationshipDetails && likec4model && edge.relations.length > 0) {
      return (
        <RelationshipsDropdownMenu
          disabled={isDimmed}
          likec4model={likec4model}
          edge={edge}>
          {node}
        </RelationshipsDropdownMenu>
      )
    }
    return node
  }

  return (
    <EdgeLabelRenderer>
      {wrapWithPopover(
        <Box {...props}>
          {stepNum !== null && (
            <Box className={edgesCss.stepEdgeNumber}>
              {stepNum}
            </Box>
          )}
          {isTruthy(label?.text) && (
            <Box className={edgesCss.edgeLabelText}>
              {label.text}
            </Box>
          )}
          {navigateTo && <NavigateToBtn viewId={navigateTo} />}
        </Box>
      )}
    </EdgeLabelRenderer>
  )
}

const NotePopover = ({ notes, children }: PropsWithChildren<{ notes: string }>) => {
  const {
    nextDynamicStep,
    hasNext,
    hasPrevious
  } = useDiagramState(s => ({
    nextDynamicStep: s.nextDynamicStep,
    hasNext: s.activeWalkthrough?.hasNext ?? false,
    hasPrevious: s.activeWalkthrough?.hasPrevious ?? false
  }))

  const [isOpened, setIsOpened] = useState(false)
  const portalProps = useMantinePortalProps()

  useDebouncedEffect(
    () => {
      setIsOpened(true)
    },
    [],
    300
  )

  return (
    <Popover
      shadow="xs"
      offset={16}
      opened={isOpened}
      closeOnClickOutside={false}
      {...portalProps}>
      <PopoverTarget>
        {children}
      </PopoverTarget>
      <PopoverDropdown
        component={Stack}
        p={'xs'}
        onPointerDownCapture={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        onDoubleClick={e => e.stopPropagation()}
      >
        <ScrollAreaAutosize maw={450} mah={350} type="scroll" mx={'auto'} mt={2}>
          <Text component="div" className={edgesCss.edgeNoteText} p={4}>{notes}</Text>
        </ScrollAreaAutosize>
        <CloseButton
          size={'xs'}
          className={edgesCss.edgeNoteCloseButton}
          onClick={() => setIsOpened(false)}
        />
        {(hasPrevious || hasNext) && (
          <Group gap={0} justify={hasPrevious ? 'flex-start' : 'flex-end'}>
            {hasPrevious && (
              <Button
                variant="subtle"
                radius={'xs'}
                size="compact-xs"
                onClick={() => nextDynamicStep(-1)}>
                back
              </Button>
            )}
            {hasNext && (
              <Button variant="subtle" radius={'xs'} size="compact-xs" onClick={() => nextDynamicStep()}>
                next
              </Button>
            )}
          </Group>
        )}
      </PopoverDropdown>
    </Popover>
  )
}

type NavigateToBtnProps = {
  viewId: ViewID
}

function NavigateToBtn({ viewId }: NavigateToBtnProps) {
  const diagramApi = useDiagramStoreApi()
  return (
    <ActionIcon
      className={clsx('nodrag nopan', edgesCss.cssNavigateBtn)}
      size={'sm'}
      radius="sm"
      onPointerDownCapture={e => e.stopPropagation()}
      onClick={event => {
        event.stopPropagation()
        diagramApi.getState().onNavigateTo?.(viewId, event)
      }}
      role="button"
      onDoubleClick={event => event.stopPropagation()}
    >
      <IconZoomScan className={edgesCss.cssNavigateBtnIcon} />
    </ActionIcon>
  )
}
