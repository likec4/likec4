import { ActionIcon, Box } from '@mantine/core'
import { useMergedRef, useTimeout } from '@mantine/hooks'
import { useDebouncedEffect, useSyncedRef } from '@react-hookz/web'
import { IconX } from '@tabler/icons-react'
import clsx from 'clsx'
import { forwardRef, type HTMLAttributes, type ReactNode, useMemo, useRef, useState } from 'react'
import { useDiagramStoreApi } from '../hooks/useDiagramState'
import * as css from './Overlay.css'
import { OverlayContext, useOverlayDialog } from './OverlayContext'

type OverlayDialogProps = Pick<HTMLAttributes<HTMLDialogElement>, 'style' | 'className'> & {
  onClose?: (() => void) | undefined
  children: (renderProps: {
    opened: boolean
    close: () => void
  }) => ReactNode
}

export const OverlayDialog = forwardRef<HTMLDialogElement, OverlayDialogProps>(({
  className,
  children,
  onClose,
  ...props
}, forwardedRef) => {
  const onCloseRef = useSyncedRef(onClose)
  const api = useDiagramStoreApi()
  const [opened, setOpened] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const ref = useMergedRef(dialogRef, forwardedRef)

  useDebouncedEffect(
    () => {
      dialogRef.current?.showModal()
    },
    [],
    30
  )

  useDebouncedEffect(
    () => {
      setOpened(true)
    },
    [],
    80
  )

  const { start: triggerOnClose } = useTimeout(() => {
    onCloseRef.current?.()
  }, 300)

  const ctxValue = useMemo(() => ({
    openOverlay: api.getState().openOverlay,
    close: () => {
      dialogRef.current?.close()
    }
  }), [api])

  return (
    <OverlayContext.Provider value={ctxValue}>
      <dialog
        aria-modal="true"
        ref={ref}
        className={clsx(css.dialog, className)}
        onClick={e => {
          if ((e.target as any)?.nodeName?.toUpperCase() === 'DIALOG') {
            e.stopPropagation()
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
          opened,
          ...ctxValue
        })}
      </dialog>
    </OverlayContext.Provider>
  )
})

export const OverlayDialogCloseButton = () => {
  const { close } = useOverlayDialog()
  return (
    <Box pos={'absolute'} top={'1rem'} right={'1rem'}>
      <ActionIcon
        variant="default"
        // color="gray"
        size={'lg'}
        autoFocus
        onClick={(e) => {
          e.stopPropagation()
          close()
        }}>
        <IconX />
      </ActionIcon>
    </Box>
  )
}
