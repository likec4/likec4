import {
  Button,
  CloseButton,
  Group,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  ScrollAreaAutosize,
  Stack,
  Text,
} from '@mantine/core'
import { useDebouncedEffect } from '@react-hookz/web'
import { type PropsWithChildren, useState } from 'react'
import { isNonNull, isTruthy } from 'remeda'
import { useMantinePortalProps } from '../../../hooks'
import { useDiagram } from '../../../hooks/useDiagram'
import { useDiagramContext } from '../../../hooks/useDiagramContext'
import { stopPropagation } from '../../../utils'
import * as edgesCss from './NotePopover.css'

export const NotePopover = ({ notes, children }: PropsWithChildren<{ notes: string }>) => {
  const {
    isActive,
    isParallel,
    hasNext,
    hasPrevious,
  } = useDiagramContext(s => ({
    isActive: isNonNull(s.activeWalkthrough),
    isParallel: isTruthy(s.activeWalkthrough?.parallelPrefix),
    hasNext: s.xyedges.findIndex(e => e.id === s.activeWalkthrough?.stepId) < s.xyedges.length - 1,
    hasPrevious: s.xyedges.findIndex(e => e.id === s.activeWalkthrough?.stepId) > 0,
  }))

  const diagram = useDiagram()
  const [isOpened, setIsOpened] = useState(false)
  const portalProps = useMantinePortalProps()

  useDebouncedEffect(
    () => {
      setIsOpened(true)
    },
    [],
    300,
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
        onPointerDownCapture={stopPropagation}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
      >
        <ScrollAreaAutosize miw={180} maw={450} mah={350} type="scroll" mx={'auto'} mt={2}>
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
                onClick={() => diagram.walkthroughStep('previous')}>
                back
              </Button>
            )}
            {hasNext && (
              <Button
                variant="subtle"
                radius={'xs'}
                size="compact-xs"
                onClick={() => diagram.walkthroughStep('next')}>
                next
              </Button>
            )}
          </Group>
        )}
      </PopoverDropdown>
    </Popover>
  )
}
