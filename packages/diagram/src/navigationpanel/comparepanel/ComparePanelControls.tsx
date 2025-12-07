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
  const [ctx, { toggleCompare, switchLayout, resetManualLayout, applyLatestToManual }] = useDiagramCompareLayout()
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
      {ctx.hasEditor && (
        <HStack gap={'1'}>
          <Divider />
          <CompareActionsMenu
            disabled={ctx.layout === 'auto'}
            onResetManualLayout={resetManualLayout}
            onApplyLatestToManual={ctx.canApplyLatest ? applyLatestToManual : undefined}
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
