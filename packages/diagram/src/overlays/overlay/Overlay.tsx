import {
  Box,
  RemoveScroll,
} from '@mantine/core'
import { useDebouncedCallback, useSyncedRef } from '@react-hookz/web'
import clsx from 'clsx'
import { type HTMLMotionProps, m } from 'framer-motion'
import { type PropsWithChildren, useLayoutEffect, useRef, useState } from 'react'
import * as css from './Overlay.css'

type OverlayProps = PropsWithChildren<
  HTMLMotionProps<'dialog'> & {
    onClose: () => void
    onClick?: never
  }
>

export function Overlay({ children, onClose, className, ...rest }: OverlayProps) {
  const [opened, setOpened] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isClosingRef = useRef(false)

  // Move dialog to the top of the DOM
  // useLayoutEffect(() => dialogRef.current?.showModal(), [])
  const onCloseRef = useSyncedRef(onClose)
  const close = useDebouncedCallback(
    () => {
      if (isClosingRef.current === false) {
        isClosingRef.current = true
        onCloseRef.current()
      }
    },
    [],
    50,
  )

  useLayoutEffect(() => {
    const cancel = (e: Event) => {
      e.preventDefault()
      if (isClosingRef.current === false) {
        isClosingRef.current = true
        onCloseRef.current()
      }
    }
    dialogRef.current?.addEventListener('cancel', cancel, { capture: true })
    return () => {
      dialogRef.current?.removeEventListener('cancel', cancel, { capture: true })
    }
  }, [])

  return (
    <m.dialog
      ref={dialogRef}
      className={clsx(css.dialog, className)}
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
      onAnimationStart={() => {
        dialogRef.current?.showModal()
        setOpened(true)
      }}
      exit={{
        opacity: 0,
        translateY: -10,
        '--backdrop-blur': '0px',
        '--backdrop-opacity': '0%',
        transition: {
          duration: 0.1,
        },
        transitionEnd: {
          display: 'none',
        },
      }}
      onClick={e => {
        e.stopPropagation()
        if ((e.target as any)?.nodeName?.toUpperCase() === 'DIALOG') {
          close()
        }
      }}
      onClose={e => {
        e.preventDefault()
        e.stopPropagation()
        close()
      }}
      {...rest}
    >
      <RemoveScroll forwardProps>
        <Box className={css.body}>
          {opened && <>{children}</>}
        </Box>
      </RemoveScroll>
    </m.dialog>
  )
}
