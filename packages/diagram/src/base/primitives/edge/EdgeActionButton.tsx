import { ActionIcon } from '@mantine/core'
import { IconZoomScan } from '@tabler/icons-react'
import clsx from 'clsx'
import { stopPropagation } from '../../../utils/xyflow'
import type { EdgeProps } from '../../types'
import * as css from './EdgeLabel.css'

type EdgeActionBtnProps = EdgeProps & {
  icon?: React.ReactNode
  onClick: (e: React.MouseEvent) => void
}

export function EdgeActionButton({ icon, onClick }: EdgeActionBtnProps) {
  return (
    <ActionIcon
      className={clsx('nodrag nopan', css.actionBtn)}
      size={'sm'}
      radius="sm"
      onPointerDownCapture={stopPropagation}
      onClick={onClick}
      role="button"
      onDoubleClick={stopPropagation}
    >
      {icon ?? <IconZoomScan />}
    </ActionIcon>
  )
}
