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
import * as m from 'motion/react-m'
import { useDiagram } from '../../hooks/useDiagram'

export function SearchControl() {
  const diagram = useDiagram()
  const isMac = isMacOs()

  return (
    <UnstyledButton
      component={m.button}
      layout="position"
      onClick={e => {
        e.stopPropagation()
        diagram.openSearch()
      }}
      whileTap={{
        translateY: 1,
      }}
      className={cx(
        'group',
        hstack({
          gap: '2xs',
          paddingInline: 'sm',
          paddingBlock: '2xs',
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
          smDown: {
            display: 'none',
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
  )
}
