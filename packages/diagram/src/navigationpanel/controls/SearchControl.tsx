import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import {
  UnstyledButton,
} from '@mantine/core'
import {
  IconSearch,
} from '@tabler/icons-react'
import { isMacOs } from '@xyflow/system'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { memo } from 'react'
import { useEnabledFeatures } from '../../context'
import { useDiagram } from '../../hooks/useDiagram'

export const SearchControl = memo(() => {
  const { enableSearch, enableCompareWithLatest } = useEnabledFeatures()
  const diagram = useDiagram()
  const isMac = isMacOs()

  return (
    <AnimatePresence>
      {enableSearch && !enableCompareWithLatest && (
        <UnstyledButton
          component={m.button}
          layout="position"
          onClick={e => {
            e.stopPropagation()
            diagram.openSearch()
          }}
          whileTap={{
            scale: 0.95,
            translateY: 1,
          }}
          className={cx(
            'group',
            hstack({
              gap: 'xxs',
              paddingInline: 'sm',
              paddingBlock: 'xxs',
              rounded: 'sm',
              userSelect: 'none',
              cursor: 'pointer',
              color: {
                base: 'likec4.panel.action-icon.text',
                _hover: 'likec4.panel.action-icon.text.hover',
              },
              backgroundColor: {
                base: 'likec4.panel.action-icon.bg',
                _hover: 'likec4.panel.action-icon.bg.hover',
              },
              display: {
                base: 'none',
                '@/md': 'flex',
              },
            }),
          )}>
          <IconSearch size={14} stroke={2.5} />
          <Box
            css={{
              fontSize: '11px',
              fontWeight: 600,
              lineHeight: 1,
              opacity: 0.8,
              whiteSpace: 'nowrap',
            }}>
            {isMac ? '⌘ + K' : 'Ctrl + K'}
          </Box>
        </UnstyledButton>
      )}
    </AnimatePresence>
  )
})
SearchControl.displayName = 'SearchControl'
