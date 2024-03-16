import type { AutoLayoutDirection, DiagramView } from '@likec4/core'
import {
  ActionIcon,
  ActionIconGroup,
  Box,
  Button,
  Divider,
  Group,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Stack
} from '@mantine/core'
import { MoveHorizontalIcon, MoveVerticalIcon, ScanEyeIcon } from 'lucide-react'
import { toolbar } from './Toolbar.css'
import { extensionApi } from './vscode'

export function Toolbar({ view }: { view: DiagramView }) {
  const changeLayout = (layout: AutoLayoutDirection) => () => {
    if (layout === view.autoLayout) return
    extensionApi.change(view.id, {
      op: 'change-autolayout',
      layout
    })
  }

  const buttonProps = (layout: AutoLayoutDirection) => ({
    size: 'compact-sm',
    fz: 'xs',
    variant: layout === view.autoLayout ? 'filled' : 'light',
    color: layout === view.autoLayout ? 'blue' : 'gray',
    onClick: changeLayout(layout)
  })

  return (
    <ActionIconGroup className={toolbar}>
      <HoverCard
        position="bottom-end"
        transitionProps={{
          transition: 'pop'
        }}
      >
        <HoverCardTarget>
          <ActionIcon color="gray" variant="light">
            <ScanEyeIcon style={{ width: '70%', height: '70%' }} />
          </ActionIcon>
        </HoverCardTarget>
        <HoverCardDropdown>
          <Group gap={'md'}>
            <Stack gap={'sm'}>
              <Divider
                labelPosition="left"
                label={
                  <>
                    <MoveVerticalIcon size={12} />
                    <Box ml={5}>vertical</Box>
                  </>
                }
              />
              <Button {...buttonProps('TB')}>Top-Bottom</Button>
              <Button {...buttonProps('BT')}>Bottom-Top</Button>
            </Stack>
            <Stack gap={'sm'}>
              <Divider
                labelPosition="left"
                label={
                  <>
                    <MoveHorizontalIcon size={12} />
                    <Box ml={5}>horizontal</Box>
                  </>
                }
              />
              <Button {...buttonProps('LR')}>Left-Right</Button>
              <Button {...buttonProps('RL')}>Right-Left</Button>
            </Stack>
          </Group>
        </HoverCardDropdown>
      </HoverCard>
    </ActionIconGroup>
  )
}
