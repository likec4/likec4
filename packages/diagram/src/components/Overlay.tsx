import { useMergedRef, useTimeout } from '@mantine/hooks'
import { useMountEffect } from '@react-hookz/web'
import clsx from 'clsx'
import { forwardRef, type HTMLAttributes, type ReactNode, useRef } from 'react'
import * as css from './Overlay.css'

type OverlayDialogProps = Pick<HTMLAttributes<HTMLDialogElement>, 'style' | 'className'> & {
  onClose?: (() => void) | undefined
  children: (renderProps: { close: () => void }) => ReactNode
}

export const OverlayDialog = forwardRef<HTMLDialogElement, OverlayDialogProps>(({
  className,
  children,
  onClose,
  ...props
}, forwardedRef) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const ref = useMergedRef(dialogRef, forwardedRef)

  useMountEffect(() => {
    dialogRef.current?.showModal()
  })

  const { start: triggerOnClose } = useTimeout(() => {
    onClose?.()
  }, 400)

  return (
    <dialog
      aria-modal="true"
      ref={ref}
      className={clsx(css.dialog, className)}
      onClick={e => {
        e.stopPropagation()
        if ((e.target as any).nodeName === 'DIALOG') {
          dialogRef.current?.close()
        }
      }}
      onClose={e => {
        e.stopPropagation()
        triggerOnClose()
      }}
      {...props}
    >
      {children({
        close: () => dialogRef.current?.close()
      })}
    </dialog>
  )
})
