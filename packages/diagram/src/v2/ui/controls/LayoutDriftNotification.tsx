import {
  type PopoverProps,
  Code,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Notification,
  Overlay,
  Text,
} from '@mantine/core'
import {
  IconAlertTriangle,
} from '@tabler/icons-react'

import { mantine } from '../../../theme-vars'
import { ActionIcon } from './_shared'

export const LayoutDriftNotification = (props: PopoverProps) => (
  <HoverCard
    position="right-start"
    openDelay={200}
    closeDelay={100}
    {...props}>
    <HoverCardTarget>
      <ActionIcon c="orange">
        <Overlay color={mantine.colors.orange.lightHover} backgroundOpacity={1} />
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
