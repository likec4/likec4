import { ActionIcon } from '@mantine/core'
import clsx from 'clsx'
import { TbZoomIn } from 'react-icons/tb'

export type NavigateToBtnProps = {
  onClick: () => void
  className?: string
}

export function NavigateToBtn({ onClick, className }: NavigateToBtnProps) {
  // const api = useLikeC4ViewEditor()
  // const navigateToView = api.navigateTo
  return (
    <ActionIcon
      className={clsx('nodrag', className)}
      radius="xl"
      autoFocus={false}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <TbZoomIn />
    </ActionIcon>
  )
}
