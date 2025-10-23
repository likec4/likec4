import { css } from '@likec4/styles/css'
import { Box, HStack } from '@likec4/styles/jsx'
import {
  Button,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Notification,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import { Fragment, memo } from 'react'
import { hasAtLeast } from 'remeda'
import { useEnabledFeatures } from '../../context/DiagramFeatures'
import { useOptionalLikeC4Editor } from '../../editor'
import { useCurrentView } from '../../hooks/useCurrentView'
import {
  type DiagramContext,
  useDiagramActorRef,
  useDiagramCompareState,
  useDiagramContext,
} from '../../hooks/useDiagram'
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'
import type { OnLayoutTypeChange } from '../../LikeC4Diagram.props'

export const LayoutDriftFrame = memo<{ onLayoutTypeChange: OnLayoutTypeChange }>(({ onLayoutTypeChange }) => {
  const { drifts, layout, isActive } = useDiagramCompareState()
  const {
    enableReadOnly,
  } = useEnabledFeatures()
  const enableEditor = !!useOptionalLikeC4Editor() && !enableReadOnly
  const diagramActorRef = useDiagramActorRef()

  const portalProps = useMantinePortalProps()

  if (!isActive) return null

  const bgColor = layout === 'manual' ? 'var(--mantine-color-orange-6)' : 'var(--mantine-color-green-6)'

  return (
    <Box
      css={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: 'full',
        height: 'full',
        border: `default`,
        borderWidth: 3,
        pointerEvents: 'none',
      }}
      style={{
        borderColor: bgColor,
      }}
    >
      <Popover
        position="right-start"
        opened={enableEditor}
        disabled={!enableEditor}
        floatingStrategy="absolute"
        offset={{
          mainAxis: 2,
          crossAxis: 4,
        }}
        {...portalProps}>
        <PopoverTarget>
          <HStack
            css={{
              position: 'absolute',
              alignItems: 'stretch',
              top: '0',
              gap: '0.5',
              py: '0',
              px: '4',
              pointerEvents: 'all',
              color: 'mantine.colors.gray[9]',
              userSelect: 'none',
              overflow: 'hidden',
            }}
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <Btn
              {...layout === 'manual' ? { 'data-selected': true } : {}}
              bg={'orange.6'}
              onClick={() => {
                onLayoutTypeChange('manual')
              }}>
              <IconAlertTriangle size={12} />
              manual
            </Btn>
            <Btn
              {...layout === 'auto' ? { 'data-selected': true } : {}}
              bg={'green.6'}
              onClick={() => {
                onLayoutTypeChange('auto')
              }}>
              auto
            </Btn>
          </HStack>
        </PopoverTarget>
        <PopoverDropdown p={3}>
          <Button
            size="compact-xs"
            variant="default"
            onClick={(e) => {
              e.stopPropagation()
              diagramActorRef.send({ type: 'layout.resetManualLayout' })
            }}
          >
            Reset layout
          </Button>
        </PopoverDropdown>
      </Popover>
    </Box>
  )
})

const Btn = UnstyledButton.withProps({
  className: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1',
    fontSize: 'xxs',
    transformOrigin: 'center top',
    transition: 'fast',
    transform: {
      base: 'translateY(-3px)',
      _hover: 'translateY(-1px)',
      _selected: 'translateY(0)!',
    },
    fontWeight: {
      base: 'normal',
      // _selected: '500',
    },
    py: '1',
    lineHeight: '1',
    borderBottomLeftRadius: 'sm',
    borderBottomRightRadius: 'sm',
    px: '2',
  }),
})
