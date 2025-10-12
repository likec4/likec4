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
import { IfNotReadOnly } from '../../context/DiagramFeatures'
import { useCurrentView } from '../../hooks/useCurrentView'
import { useDiagramActorRef } from '../../hooks/useDiagram'
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'
import type { OnLayoutTypeChange } from '../../LikeC4Diagram.props'

export function LayoutDriftFrame({ onLayoutTypeChange }: { onLayoutTypeChange: OnLayoutTypeChange }) {
  const {
    _layout: layout,
    drifts,
  } = useCurrentView()
  const diagramActorRef = useDiagramActorRef()

  const portalProps = useMantinePortalProps()

  if (!drifts || drifts.length === 0) return null

  const bgColor = layout === 'manual' ? 'var(--mantine-color-orange-6)' : 'var(--mantine-color-green-6)'

  return (
    <>
      <Box
        css={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: 'full',
          height: 'full',
          border: `default`,
          borderWidth: 2,
          pointerEvents: 'none',
        }}
        style={{
          borderColor: bgColor,
        }}
      >
      </Box>
      <HoverCard
        disabled={layout !== 'manual'}
        position="bottom"
        openDelay={500}
        closeDelay={100}
        floatingStrategy="absolute"
        {...portalProps}>
        <HoverCardTarget>
          <HStack
            css={{
              position: 'absolute',
              top: '0',
              gap: '2',
              left: '[50%]',
              transform: 'translateX(-50%)',
              pointerEvents: 'all',
              color: 'mantine.colors.gray[9]',
              borderBottomLeftRadius: 'sm',
              borderBottomRightRadius: 'sm',
              py: '0',
              px: '2',
              userSelect: 'none',
            }}
            style={{
              backgroundColor: bgColor,
            }}
          >
            <IconAlertTriangle size={13} />
            <Btn
              {...layout === 'manual' ? { 'data-selected': true } : {}}
              onClick={() => {
                onLayoutTypeChange('manual')
              }}>
              manual
            </Btn>
            <Btn
              {...layout === 'auto' ? { 'data-selected': true } : {}}
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
              Switch to the "auto" for current state.<br />
              {drifts.map((drift, i, all) => (
                <>
                  <span key={drift}>- {drift}</span>
                  {i < all.length - 1 && <br />}
                </>
              ))}
            </Text>
            <IfNotReadOnly>
              <Button
                mt={'xs'}
                size="compact-xs"
                color="orange"
                onClick={(e) => {
                  e.stopPropagation()
                  diagramActorRef.send({ type: 'layout.resetManualLayout' })
                }}
              >
                Reset layout
              </Button>
            </IfNotReadOnly>
          </Notification>
        </HoverCardDropdown>
      </HoverCard>
    </>
  )
}

const Btn = UnstyledButton.withProps({
  className: css({
    fontSize: 'xxs',
    fontWeight: {
      base: 'normal',
      _selected: '500',
    },
    py: '1',
    lineHeight: '1',
  }),
})
