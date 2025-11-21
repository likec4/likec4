import { cx } from '@likec4/styles/css'
import { edgeActionBtn } from '@likec4/styles/recipes'
import { ActionIcon } from '@mantine/core'
import { IconZoomScan } from '@tabler/icons-react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { stopPropagation } from '../../utils/xyflow'

type EdgeActionBtnProps = {
  icon?: ReactNode
  onClick: (e: ReactMouseEvent) => void
}

export function EdgeActionButton({ icon, onClick }: EdgeActionBtnProps) {
  return (
    <ActionIcon
      className={cx('nodrag nopan', edgeActionBtn())}
      onPointerDownCapture={stopPropagation}
      onClick={onClick}
      role="button"
      onDoubleClick={stopPropagation}
    >
      {icon ?? <IconZoomScan />}
    </ActionIcon>
  )
}
