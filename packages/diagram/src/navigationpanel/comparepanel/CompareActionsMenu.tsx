import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import { Menu, Tooltip, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconInfoCircle } from '@tabler/icons-react'
import { stopPropagation } from '../../utils'

export function CompareActionsMenu({
  disabled = false,
  onApplyLatestToManual,
  onResetManualLayout,
}: {
  disabled?: boolean
  onApplyLatestToManual?: undefined | (() => void)
  onResetManualLayout: () => void
}) {
  return (
    <Menu
      withinPortal={false} // if we render menu in portal, NavigationPanelDropdown receives onMouseLeave event
      floatingStrategy="absolute"
      shadow="lg"
      position="bottom-start"
      offset={{ mainAxis: 4 }}
      disabled={disabled}
    >
      <Menu.Target>
        <UnstyledButton
          disabled={disabled}
          className={cx(
            'mantine-active',
            hstack({
              gap: '2',
              py: '1.5',
              px: '2',
              lineHeight: '1',
              textStyle: 'xs',
              fontWeight: 'medium',
              layerStyle: 'likec4.panel.action',
              userSelect: 'none',
            }),
          )}
        >
          <Box>Actions</Box>
          <IconChevronDown size={12} stroke={2} opacity={0.7} />
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          disabled={!onApplyLatestToManual}
          onClick={onApplyLatestToManual}
          rightSection={onApplyLatestToManual &&
            (
              <Tooltip
                onClick={stopPropagation}
                position="right-start"
                label={
                  <>
                    Applies changes from the latest auto-layouted<br />
                    to saved snapshot, preserving (as possible)<br />
                    manual adjustments.<br />
                    <br />
                    You can undo this action.
                  </>
                }
              >
                <IconInfoCircle size={14} stroke={1.7} opacity={0.5} />
              </Tooltip>
            )}
        >
          Sync with latest
          {!onApplyLatestToManual && <Box textStyle={'xs'}>view type is changed</Box>}
        </Menu.Item>
        <Menu.Item onClick={onResetManualLayout}>Remove manual layout</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
