import { css, cx } from '@likec4/styles/css'
import { Box, HStack } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import { navigationPanelActionIcon } from '@likec4/styles/recipes'
import { Button, Divider as MantineDivider, Menu, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconX } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import { useDiagramCompareLayout } from '../../hooks/useDiagramCompareLayout'
import { PanelActionIcon } from '../_common'
import { CompareActionsMenu } from './CompareActionsMenu'
import { LayoutTypeSwitcher } from './LayoutTypeSwitcher'

const Divider = MantineDivider.withProps({
  mx: 2,
  size: 'xs',
  orientation: 'vertical',
})

export function ComparePanelControls() {
  const [ctx, { toggleCompare, switchLayout, resetManualLayout }] = useDiagramCompareLayout()
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
      {ctx.isEditable && (
        <HStack gap={'1'}>
          <Divider />
          <CompareActionsMenu
            onResetManualLayout={resetManualLayout}
          />
          <Divider />
        </HStack>
      )}

      <PanelActionIcon
        size={'sm'}
        onClick={e => {
          e.stopPropagation()
          toggleCompare()
        }}>
        <IconX />
      </PanelActionIcon>
    </>
  )
}
