import { css, cx } from '@likec4/styles/css'
import { Box, HStack } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import { navigationPanelActionIcon } from '@likec4/styles/recipes'
import { Button, Divider as MantineDivider, Menu, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconX } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import { useDiagramCompareLayout } from '../../hooks/useDiagramCompareLayout'
import { PanelActionIcon } from '../_common'
import { LayoutTypeSwitcher } from './LayoutTypeSwitcher'

const Divider = MantineDivider.withProps({
  mx: 2,
  size: 'xs',
  orientation: 'vertical',
})

export function ComparePanelControls() {
  const [ctx, { toggleCompare, switchLayout }] = useDiagramCompareLayout()
  return (
    <>
      <Box
        css={{
          textStyle: 'xs',
          color: 'likec4.panel.text',
          userSelect: 'none',
        }}>
        Compare
      </Box>
      <LayoutTypeSwitcher
        value={ctx.layout}
        onChange={switchLayout} />
      <HStack gap={'0'}>
        <Divider />
        <CompareActionsMenu />
        <Divider />
      </HStack>

      <PanelActionIcon
        size={'sm'}
        onClick={e => {
          e.stopPropagation()
          toggleCompare()
        }}>
        <IconX />
      </PanelActionIcon>
      {
        /* <UnstyledButton
        component={m.button}
        layout="position"
        onClick={e => {
          e.stopPropagation()
          toggleCompare()
          // toggleCompare()
          // // reset layout to manual if compare is active
          // if (isActive && ctx.layout !== 'manual') {
          //   switchLayout('manual')
          // }
        }}
        whileTap={{
          scale: 0.95,
          translateY: 1,
        }}
        className={cx(
          'group',
          navigationPanelActionIcon({
            variant: 'filled',
            // type: 'warning',
          }),
          css({
            py: '1',
            px: '2',
            rounded: 'sm',
            userSelect: 'none',
            cursor: 'pointer',
            fontSize: 'xs',
            fontWeight: 'medium',
            // fontWeight: 600,
          }),
        )}>
        Cancel
      </UnstyledButton> */
      }
    </>
  )
}

const CompareActionsMenu = () => {
  return (
    <Menu
      withinPortal={false} // if we render menu in portal, NavigationPanelDropdown receives onMouseLeave event
      shadow="md"
      position="bottom-start"
      offset={{ mainAxis: 2 }}>
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
              pl: '3',
              lineHeight: '1',
              rounded: 'sm',
              textStyle: 'xs',
              // fontWeight: 'medium',
              color: { base: 'likec4.panel.text.action', _hover: 'likec4.panel.text.action.hover' },
              userSelect: 'none',
            }),
          )}
        >
          <Box>Actions</Box>
          <IconChevronDown size={12} stroke={2} opacity={0.7} />
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item>Apply updates from latest</Menu.Item>
        <Menu.Item>Reset layout to latest</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
