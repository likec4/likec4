import { css, cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { actionBtn } from '@likec4/styles/recipes'
import { ActionIcon } from '@mantine/core'
import { useId } from '@mantine/hooks'
import { IconId } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import type { BaseNodeData } from '../../base/types'
import { stopPropagation } from '../../utils/xyflow'

type ElementDetailsButtonProps = {
  selected?: boolean
  data: BaseNodeData
  icon?: React.ReactNode
  onClick: (e: React.MouseEvent) => void
}

const container = css({
  position: 'absolute',
  top: '0.5',
  right: '0.5',
  _shapeBrowser: {
    right: '[5px]',
  },
  _shapeCylinder: {
    top: '[14px]',
  },
  _shapeStorage: {
    top: '[14px]',
  },
  _shapeQueue: {
    top: '[1px]',
    right: '3', // 12px
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
  const id = useId()
  return (
    <Box className={cx(container, 'details-button')}>
      <ActionIcon
        key={id}
        className={cx('nodrag nopan', actionBtn({ variant: 'transparent' }))}
        component={m.button}
        // layout
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
