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
import { m } from 'motion/react'
import { useRef } from 'react'
import { useDiagram } from '../../hooks/useDiagram'

export function SearchControl() {
  const diagram = useDiagram()
  const isMac = isMacOs()

  const searchControlAnimation = useRef({
    initial: { opacity: 0, translateX: -10 },
    animate: { opacity: 1, translateX: 0 },
    exit: { opacity: 0, translateX: -20 },
    whileTap: {
      scale: 0.95,
      translateY: 1,
    },
  })

  return (
    <UnstyledButton
      component={m.button}
      layout="position"
      onClick={e => {
        e.stopPropagation()
        diagram.openSearch()
      }}
      {...searchControlAnimation.current}
      className={cx(
        'group',
        hstack({
          gap: 'xxs',
          paddingInline: 'sm',
          userSelect: 'none',
          layerStyle: 'likec4.panel.action.filled',
          display: {
            base: 'none',
            '@/md': 'flex',
          },
        }),
      )}>
      <IconSearch size={14} stroke={2.5} />
      <Box
        css={{
          fontSize: 'xs',
          fontWeight: 'bold',
          lineHeight: '1',
          opacity: '0.7',
          whiteSpace: 'nowrap',
        }}>
        {isMac ? '⌘ + K' : 'Ctrl + K'}
      </Box>
    </UnstyledButton>
  )
}
