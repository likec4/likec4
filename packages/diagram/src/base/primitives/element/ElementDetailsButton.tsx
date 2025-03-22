import { css, cx } from '@likec4/styles/css'
import { actionBtn } from '@likec4/styles/recipes'
import { ActionIcon, Box } from '@mantine/core'
import { IconId } from '@tabler/icons-react'
import { m } from 'framer-motion'
import { stopPropagation } from '../../../utils/xyflow'
import type { NodeProps } from '../../types'

type ElementDetailsButtonProps = NodeProps & {
  icon?: React.ReactNode
  onClick: (e: React.MouseEvent) => void
}

const container = css({
  position: 'absolute',
  top: 2,
  right: 2,
  _shapeBrowser: {
    right: '5px',
  },
  _shapeCylinder: {
    top: '14px',
  },
  _shapeStorage: {
    top: '14px',
  },
  _shapeQueue: {
    top: '1px',
    right: '12px',
  },
  _smallZoom: {
    display: 'none',
  },
})

export function ElementDetailsButton({
  selected = false,
  data: {
    hovered: isHovered = false,
  },
  icon,
  onClick,
}: ElementDetailsButtonProps) {
  return (
    <Box className={cx(container, 'details-button')}>
      <ActionIcon
        className={cx('nodrag nopan', actionBtn({ variant: 'transparent' }))}
        component={m.button}
        initial={false}
        style={{
          originX: 0.45,
          originY: 0.55,
        }}
        animate={(isHovered || selected)
          ? {
            scale: 1.2,
            opacity: 0.8,
          }
          : {
            scale: 1,
            opacity: 0.5,
          }}
        whileHover={{
          scale: 1.4,
          opacity: 1,
        }}
        whileTap={{ scale: 1.15 }}
        onClick={onClick}
        onDoubleClick={stopPropagation}
      >
        {icon ?? <IconId stroke={1.8} style={{ width: '75%' }} />}
      </ActionIcon>
    </Box>
  )
}
