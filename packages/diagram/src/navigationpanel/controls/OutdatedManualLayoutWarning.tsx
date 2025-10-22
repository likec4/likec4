import { cx } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import { navigationPanelActionIcon } from '@likec4/styles/recipes'
import {
  Button,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Notification,
  Text,
  UnstyledButton,
} from '@mantine/core'
import {
  IconAlertTriangle,
} from '@tabler/icons-react'
import * as m from 'motion/react-m'
import { Fragment, memo } from 'react'
import { useDiagramEventHandlers } from '../../context/DiagramEventHandlers'
import {
  useDiagramActorRef,
  useDiagramCompareState,
  useMantinePortalProps,
} from '../../hooks'

export const OutdatedManualLayoutWarning = memo(() => {
  const ctx = useDiagramCompareState()
  const diagramActorRef = useDiagramActorRef()
  const { onLayoutTypeChange } = useDiagramEventHandlers()
  const portalProps = useMantinePortalProps()

  if (!ctx.isEnabled) return null

  const { drifts, isActive } = ctx

  // const bgColor = layout === 'manual' ? 'var(--mantine-color-orange-6)' : 'var(--mantine-color-green-6)'

  return (
    // <Tooltip label="Open View Source">
    // {
    //   /* <PanelActionIcon
    //   variant="filled"
    //   type="warning"
    //   onClick={e => {
    //     e.stopPropagation()
    //     // onOpenSource?.({ view: viewId })
    //   }}
    //   children={<IconAlertTriangle style={{ width: '60%', height: '60%' }} />}
    // /> */
    // }
    <HoverCard
      position="bottom-start"
      openDelay={250}
      closeDelay={200}
      floatingStrategy="absolute"
      disabled={isActive}
      offset={{
        mainAxis: 4,
        crossAxis: -22,
      }}
      {...portalProps}>
      <HoverCardTarget>
        <UnstyledButton
          component={m.button}
          layout="position"
          onClick={e => {
            e.stopPropagation()
            diagramActorRef.send({ type: 'toggle.feature', feature: 'CompareWithLatest' })
            // reset layout to manual if compare is active
            if (isActive) {
              onLayoutTypeChange?.('manual')
            }
          }}
          whileTap={{
            scale: 0.95,
            translateY: 1,
          }}
          className={cx(
            'group',
            navigationPanelActionIcon({
              variant: 'filled',
              type: 'warning',
            }),
            hstack({
              gap: 'xxs',
              padding: '1.5',
              rounded: 'sm',
              userSelect: 'none',
              cursor: 'pointer',
              fontSize: 'xs',
              fontWeight: 600,
            }),
          )}>
          {isActive ? <>Stop Compare</> : <IconAlertTriangle size={18} />}
          {
            /* <Box
          css={{
            fontSize: '11px',
            fontWeight: 600,
            lineHeight: 1,
            opacity: 0.8,
            whiteSpace: 'nowrap',
          }}>
           {isMac ? '⌘ + K' : 'Ctrl + K'}
        </Box> */
          }
        </UnstyledButton>
      </HoverCardTarget>
      <HoverCardDropdown p={'0'}>
        <Notification
          color="orange"
          withBorder={false}
          withCloseButton={false}
          title="View is out of sync">
          <Text mt={2} size="sm" lh="xs">
            This view has been modified and can't be updated automatically.
          </Text>
          <Text mt={4} size="sm" lh="xs">
            Detected changes:
            {drifts.map((drift) => (
              <Fragment key={drift}>
                <br />
                <span>- {drift}</span>
              </Fragment>
            ))}
          </Text>

          <Button
            mt={'xs'}
            size="compact-xs"
            variant="default"
            onClick={(e) => {
              e.stopPropagation()
              diagramActorRef.send({ type: 'toggle.feature', feature: 'CompareWithLatest' })
            }}
          >
            Compare with current state
          </Button>
        </Notification>
      </HoverCardDropdown>
    </HoverCard>
  )
})
OutdatedManualLayoutWarning.displayName = 'OutdatedManualLayoutWarning'
