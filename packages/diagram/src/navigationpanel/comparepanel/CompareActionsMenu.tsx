import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import { navigationPanelActionIcon } from '@likec4/styles/recipes'
import { Badge, Menu, UnstyledButton } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react'

export function CompareActionsMenu({
  onResetManualLayout,
}: {
  onResetManualLayout: () => void
}) {
  return (
    <Menu
      withinPortal={false} // if we render menu in portal, NavigationPanelDropdown receives onMouseLeave event
      floatingStrategy="absolute"
      shadow="lg"
      position="bottom-start"
      offset={{ mainAxis: 4 }}
    >
      <Menu.Target>
        <UnstyledButton
          className={cx(
            'mantine-active',
            navigationPanelActionIcon({
              variant: 'default',
            }),
            hstack({
              gap: '2',
              py: '1.5',
              px: '2',
              lineHeight: '1',
              rounded: 'sm',
              textStyle: 'xs',
              fontWeight: 'medium',
              color: {
                base: 'likec4.panel.action',
                _hover: 'likec4.panel.action.hover',
              },
              userSelect: 'none',
            }),
          )}
        >
          <Box>Actions</Box>
          <IconChevronDown size={12} stroke={2} opacity={0.7} />
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item disabled rightSection={<Badge size="xs" radius="sm">Soon</Badge>}>
          Apply changes
        </Menu.Item>
        <Menu.Item fz={'sm'} onClick={onResetManualLayout}>Reset manual layout</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
