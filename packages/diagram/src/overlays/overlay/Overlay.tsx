import { cx } from '@likec4/styles/css'
import {
  Box,
  RemoveScroll,
} from '@mantine/core'
import { useDebouncedCallback, useSyncedRef, useTimeoutEffect } from '@react-hookz/web'
import { type HTMLMotionProps, m } from 'framer-motion'
import { type PropsWithChildren, useLayoutEffect, useRef, useState } from 'react'
import { stopPropagation } from '../../utils'
import * as styles from './Overlay.css'

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
      // Move dialog to the top of the DOM
      dialogRef.current?.showModal()
    }
    setOpened(true)
  }, 30)

  return (
    <m.dialog
      ref={dialogRef}
      className={cx(RemoveScroll.classNames.fullWidth, styles.dialog, classes?.dialog, className)}
      initial={{
        [styles.backdropBlur]: '0px',
        [styles.backdropOpacity]: '5%',
        opacity: 0.85,
        translateY: 12,
      }}
      animate={{
        [styles.backdropBlur]: '6px',
        [styles.backdropOpacity]: '50%',
        translateY: 0,
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        translateY: -10,
        [styles.backdropBlur]: '0px',
        [styles.backdropOpacity]: '0%',
        transition: {
          duration: 0.1,
        },
      }}
      onClick={e => {
        e.stopPropagation()
        if ((e.target as any)?.nodeName?.toUpperCase() === 'DIALOG') {
          dialogRef.current?.close()
          return
        }
      }}
      onDoubleClick={stopPropagation}
      onPointerDown={stopPropagation}
      onClose={e => {
        e.stopPropagation()
        close()
      }}
      {...rest}
    >
      <RemoveScroll forwardProps removeScrollBar={false}>
        <Box className={cx(styles.body, classes?.body)}>
          {opened && <>{children}</>}
        </Box>
      </RemoveScroll>
    </m.dialog>
  )
}
