import {
  ActionIcon,
  Code,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Notification,
  Text,
} from '@mantine/core'
import {
  IconAlertTriangle,
} from '@tabler/icons-react'

import { css } from '@likec4/styles/css'
import { useMantinePortalProps } from '../../hooks'
import { useDiagramContext } from '../../hooks/useDiagram'

export const LayoutDriftNotification = () => {
  const portalProps = useMantinePortalProps()
  const hasLayoutDrift = useDiagramContext(c => c.view.hasLayoutDrift ?? false)
  if (!hasLayoutDrift) return null
  return (
    <HoverCard
      position="right-start"
      openDelay={200}
      closeDelay={100}
      {...portalProps}>
      <HoverCardTarget>
        <ActionIcon
          color={'orange'}
          c="orange"
          className={css({
            bg: 'mantine.colors.orange.light',
          })}
        >
          <IconAlertTriangle />
        </ActionIcon>
      </HoverCardTarget>
      <HoverCardDropdown p={'0'}>
        <Notification
          color="orange"
          withBorder={false}
          withCloseButton={false}
          title="Manual layout issues">
          <Text mt={2} size="sm" lh="xs">
            View contains new elements or their sizes have changed,<br />
            last manual layout can not be applied.
          </Text>
          <Text mt={'xs'} size="sm" lh="xs">
            Update view predicates or remove <Code>@likec4-generated</Code>
          </Text>
        </Notification>
      </HoverCardDropdown>
    </HoverCard>
  )
}
