// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { cx } from '@likec4/styles/css'
import { edgeActionBtn } from '@likec4/styles/recipes'
import { ActionIcon } from '@mantine/core'
import { IconZoomScan } from '@tabler/icons-react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { stopPropagation } from '../../utils/xyflow'

type EdgeActionBtnProps = {
  icon?: ReactNode
  ariaLabel?: string
  onClick: (e: ReactMouseEvent) => void
}

export function EdgeActionButton({ icon, ariaLabel = 'Navigate to view', onClick }: EdgeActionBtnProps) {
  return (
    <ActionIcon
      className={cx('nodrag nopan', edgeActionBtn())}
      onPointerDownCapture={stopPropagation}
      onClick={onClick}
      role="button"
      aria-label={ariaLabel}
      onDoubleClick={stopPropagation}
    >
      {icon ?? <IconZoomScan />}
    </ActionIcon>
  )
}
