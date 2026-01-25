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
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { Fragment, memo } from 'react'
import { useDiagramCompareLayout } from '../../hooks/useDiagramCompareLayout'
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'

export const LayoutWarning = memo(() => {
  const [ctx, { toggleCompare }] = useDiagramCompareLayout()
  const portalProps = useMantinePortalProps()

  const { drifts, isActive, isEnabled } = ctx

  return (
    <AnimatePresence propagate>
      {isEnabled && !isActive && (
        <HoverCard
          position="bottom-start"
          openDelay={600}
          closeDelay={200}
          floatingStrategy="absolute"
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
                toggleCompare()
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
                  fontWeight: 'bold',
                }),
              )}>
              {isActive ? <>Stop Compare</> : <IconAlertTriangle size={18} />}
            </UnstyledButton>
          </HoverCardTarget>
          <HoverCardDropdown p={'0'}>
            <Notification
              color="orange"
              withBorder={false}
              withCloseButton={false}
              title="View is out of sync">
              <Text mt={2} size="sm" lh="xs">
                Model has changed since this view was last updated.
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
                size="compact-sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleCompare()
                }}
              >
                Compare with current state
              </Button>
            </Notification>
          </HoverCardDropdown>
        </HoverCard>
      )}
    </AnimatePresence>
  )
})
LayoutWarning.displayName = 'ManualLayoutWarning'
