import { css } from '@likec4/styles/css'
import { Box, HStack } from '@likec4/styles/jsx'
import {
  Button,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Notification,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import { Fragment } from 'react'
import { useEnabledFeatures } from '../../context/DiagramFeatures'
import { useCurrentView } from '../../hooks/useCurrentView'
import { useDiagramActorRef } from '../../hooks/useDiagram'
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'
import type { OnLayoutTypeChange } from '../../LikeC4Diagram.props'

export function LayoutDriftFrame({ onLayoutTypeChange }: { onLayoutTypeChange: OnLayoutTypeChange }) {
  const {
    _layout: layout,
    drifts,
  } = useCurrentView()
  const {
    enableReadOnly,
    enableVscode,
  } = useEnabledFeatures()
  const diagramActorRef = useDiagramActorRef()

  const portalProps = useMantinePortalProps()

  if (!drifts || drifts.length === 0) return null

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
      <HoverCard
        position="bottom"
        openDelay={500}
        closeDelay={200}
        floatingStrategy="absolute"
        offset={2}
        {...portalProps}>
        <HoverCardTarget>
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
        </HoverCardTarget>
        <HoverCardDropdown p={'0'}>
          <Notification
            color="orange"
            withBorder={false}
            withCloseButton={false}
            title="Manual layout out of sync">
            <Text mt={2} size="sm" lh="xs">
              View contains new elements or their sizes have changed,<br />
              Switch to the "auto" for current state.
              {drifts.map((drift, i, all) => (
                <Fragment key={drift}>
                  <br />
                  <span>- {drift}</span>
                </Fragment>
              ))}
            </Text>
            {enableReadOnly && enableVscode && (
              <Text mt={'xs'} size="sm" lh="xs">
                Unlock editing to reset layout.
              </Text>
            )}
            {enableReadOnly && (
              <Button
                mt={'xs'}
                size="compact-xs"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation()
                  diagramActorRef.send({ type: 'layout.resetManualLayout' })
                }}
              >
                Reset layout
              </Button>
            )}
          </Notification>
        </HoverCardDropdown>
      </HoverCard>
    </Box>
  )
}

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
