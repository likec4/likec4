import { Box, HStack } from '@likec4/styles/jsx'
import { Divider as MantineDivider } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
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
