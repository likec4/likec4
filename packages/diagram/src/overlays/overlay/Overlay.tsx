import {
  Box,
  RemoveScroll,
} from '@mantine/core'
import { useDebouncedCallback, useSyncedRef, useTimeoutEffect } from '@react-hookz/web'
import clsx from 'clsx'
import { type HTMLMotionProps, m } from 'framer-motion'
import { type PropsWithChildren, useLayoutEffect, useRef, useState } from 'react'
import * as css from './Overlay.css'

type OverlayProps = PropsWithChildren<
  HTMLMotionProps<'dialog'> & {
    classes?: {
      dialog?: string
      body?: string
    }
    onClose: () => void
    onClick?: never
  }
>

export function Overlay({ children, onClose, className, classes, ...rest }: OverlayProps) {
  const [opened, setOpened] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isClosingRef = useRef(false)

  // Move dialog to the top of the DOM
  const onCloseRef = useSyncedRef(onClose)
  const close = useDebouncedCallback(
    () => {
      if (isClosingRef.current) return
      isClosingRef.current = true
      onCloseRef.current()
    },
    [],
    50,
  )
  // const close = useCallbackRef(() => {
  //   if (isOpenedRef.current) {
  //     isOpenedRef.current = false
  //     requestAnimationFrame(() => {
  //       onClose()
  //     })
  //   }
  // })

  useLayoutEffect(() => {
    const cancel = (e: Event) => {
      e.preventDefault()
      close()
    }
    dialogRef.current?.addEventListener('cancel', cancel, { capture: true })
    return () => {
      dialogRef.current?.removeEventListener('cancel', cancel, { capture: true })
    }
  }, [])

  useTimeoutEffect(() => {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal()
    }
    setOpened(true)
  }, 30)

  return (
    <m.dialog
      ref={dialogRef}
      className={clsx(css.dialog, classes?.dialog, className, RemoveScroll.classNames.fullWidth)}
      initial={{
        '--backdrop-blur': '0px',
        '--backdrop-opacity': '5%',
        opacity: 0.85,
        translateY: 12,
        // opacity: 02.8,
      }}
      animate={{
        '--backdrop-blur': '6px',
        '--backdrop-opacity': '60%',
        translateY: 0,
        opacity: 1,
        // transition: {
        //   delay: 0.25,
        // }
      }}
      exit={{
        opacity: 0,
        translateY: -10,
        '--backdrop-blur': '0px',
        '--backdrop-opacity': '0%',
        transition: {
          duration: 0.1,
        },
      }}
      onClick={e => {
        if ((e.target as any)?.nodeName?.toUpperCase() === 'DIALOG') {
          e.stopPropagation()
          dialogRef.current?.close()
          return
        }
      }}
      onClose={e => {
        e.stopPropagation()
        close()
      }}
      {...rest}
    >
      <RemoveScroll forwardProps removeScrollBar={false}>
        <Box className={clsx(css.body, classes?.body)}>
          {opened && <>{children}</>}
        </Box>
      </RemoveScroll>
    </m.dialog>
  )
}
