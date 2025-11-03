import { css } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import {
  UnstyledButton,
} from '@mantine/core'
import { memo } from 'react'
import { useDiagramCompareLayout } from '../../hooks/useDiagramCompareLayout'

export const LayoutDriftFrame = memo(() => {
  const [{ layout, isActive }, { toggleCompare }] = useDiagramCompareLayout()

  const bgColor = layout === 'manual' ? 'var(--mantine-color-orange-6)' : 'var(--mantine-color-green-6)'

  return (
    <Box
      className={hstack({
        position: 'absolute',
        top: '0',
        left: '0',
        width: 'full',
        height: 'full',
        border: `default`,
        borderWidth: 4,
        pointerEvents: 'none',
        alignItems: 'flex-start',
        justifyContent: 'center',
      })}
      style={{
        zIndex: '9999',
        display: !isActive ? 'none' : undefined,
        borderColor: bgColor,
      }}
    >
      <Btn
        style={{
          backgroundColor: bgColor,
        }}
        onClick={(e) => {
          e.stopPropagation()
          toggleCompare()
        }}>
        Close compare
      </Btn>
    </Box>
  )
})

const Btn = UnstyledButton.withProps({
  className: css({
    fontSize: 'xs',
    fontWeight: 'medium',
    py: '1.5',
    lineHeight: '1',
    borderBottomLeftRadius: 'sm',
    borderBottomRightRadius: 'sm',
    transform: 'translateY(-4px)',
    px: '4',
    color: 'mantine.colors.gray[9]',
    pointerEvents: 'all',
    _active: {
      transform: 'translateY(-3px)',
    },
  }),
})
