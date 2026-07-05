// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { css, cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { actionBtn } from '@likec4/styles/recipes'
import { ActionIcon } from '@mantine/core'
import { IconId } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import type { BaseNodeData } from '../../base/types'
import { stopPropagation } from '../../utils/xyflow'

type ElementDetailsButtonProps = {
  selected?: boolean
  data: BaseNodeData
  icon?: ReactNode
  ariaLabel?: string
  onClick: (e: ReactMouseEvent) => void
}

const variants = {
  normal: {
    originX: 0.4,
    originY: 0.6,
    scale: 1,
    opacity: 0.5,
  },
  hovered: {
    originX: 0.4,
    originY: 0.6,
    scale: 1.25,
    opacity: 0.9,
  },
  selected: {
    originX: 0.4,
    originY: 0.6,
    scale: 1.25,
    opacity: 0.9,
  },
  whileHover: {
    scale: 1.4,
    opacity: 1,
  },
  whileTap: {
    scale: 1.15,
  },
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
  _print: {
    display: 'none',
  },
})

export function ElementDetailsButton({
  selected = false,
  data: {
    hovered: isHovered = false,
  },
  icon,
  ariaLabel = 'Open details',
  onClick,
}: ElementDetailsButtonProps) {
  let variant: keyof typeof variants
  switch (true) {
    case isHovered:
      variant = 'hovered'
      break
    case selected:
      variant = 'selected'
      break
    default:
      variant = 'normal'
  }
  const isActionVisible = isHovered || selected
  return (
    <Box className={cx(container, 'details-button')}>
      <ActionIcon
        className={cx(
          'nodrag nopan',
          actionBtn({ variant: 'transparent' }),
        )}
        component={m.button}
        initial={false}
        variants={variants}
        animate={variant}
        whileHover="whileHover"
        whileTap="whileTap"
        onClick={onClick}
        onDoubleClick={stopPropagation}
        tabIndex={isActionVisible ? 0 : -1}
        inert={isActionVisible ? undefined : true}
        aria-label={ariaLabel}
      >
        {icon ?? <IconId stroke={1.8} style={{ width: '75%' }} />}
      </ActionIcon>
    </Box>
  )
}
