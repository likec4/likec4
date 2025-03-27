import { cx } from '@likec4/styles/css'
import {
  Box,
  RemoveScroll,
} from '@mantine/core'
import { useMergedRef } from '@mantine/hooks'
import { useDebouncedCallback, useSyncedRef, useTimeoutEffect } from '@react-hookz/web'
import { type HTMLMotionProps, m } from 'framer-motion'
import { type PropsWithChildren, forwardRef, useLayoutEffect, useRef, useState } from 'react'
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

export const Overlay = forwardRef<HTMLDialogElement, OverlayProps>(
  ({ children, onClose, className, classes, ...rest }, ref) => {
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
    }, 10)

    useTimeoutEffect(() => {
      setOpened(true)
    }, 120)

    return (
      <m.dialog
        ref={useMergedRef(dialogRef, ref)}
        className={cx(RemoveScroll.classNames.fullWidth, styles.dialog, classes?.dialog, className)}
        initial={{
          [styles.backdropBlur]: '0px',
          [styles.backdropOpacity]: '0%',
          scale: 1.075,
          opacity: 0.2,
          // originY: 0.45,
          // translateY: '-10px',
        }}
        animate={{
          [styles.backdropBlur]: '8px',
          [styles.backdropOpacity]: '60%',
          scale: 1,
          opacity: 1,
          // translateY: '0px',
          transition: {
            delay: 0.06,
            // duration: 0.2,
          },
        }}
        exit={{
          scale: 1.3,
          opacity: 0,
          [styles.backdropBlur]: '0px',
          [styles.backdropOpacity]: '0%',
          // transition: {
          //   duration: 0.2,
          // },
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
          <Box className={cx(styles.body, 'overlay-body', classes?.body)}>
            {opened && <>{children}</>}
          </Box>
        </RemoveScroll>
      </m.dialog>
    )
  },
)
Overlay.displayName = 'Overlay'
