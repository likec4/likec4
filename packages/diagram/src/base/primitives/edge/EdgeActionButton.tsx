import { cx } from '@likec4/styles/css'
import { ActionIcon } from '@mantine/core'
import { IconZoomScan } from '@tabler/icons-react'
import { stopPropagation } from '../../../utils/xyflow'
import { actionBtn } from './edge.css'

type EdgeActionBtnProps = {
  icon?: React.ReactNode
  onClick: (e: React.MouseEvent) => void
}

export function EdgeActionButton({ icon, onClick }: EdgeActionBtnProps) {
  return (
    <ActionIcon
      className={cx('nodrag nopan', actionBtn)}
      onPointerDownCapture={stopPropagation}
      onClick={onClick}
      role="button"
      onDoubleClick={stopPropagation}
    >
      {icon ?? <IconZoomScan />}
    </ActionIcon>
  )
}
