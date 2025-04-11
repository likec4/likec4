import { cx } from '@likec4/styles/css'
import {
  Box,
  RemoveScroll,
} from '@mantine/core'
import { useMergedRef } from '@mantine/hooks'
import { useDebouncedCallback, useSyncedRef, useTimeoutEffect } from '@react-hookz/web'
import { m, useReducedMotionConfig } from 'motion/react'
import { type PropsWithChildren, forwardRef, useEffect, useRef, useState } from 'react'
import { stopPropagation } from '../../utils'
import { backdropBlur, backdropOpacity, level as cssVarLevel, overlay as overlayCVA } from './Overlay.css'

type OverlayProps = PropsWithChildren<{
  overlayLevel?: number
  className?: string
  classes?: {
    dialog?: string
    body?: string
  }
  onClose: () => void
  onClick?: never
}>

export const Overlay = forwardRef<HTMLDialogElement, OverlayProps>(({
  onClose,
  className,
  classes,
  overlayLevel = 0,
  children,
  ...rest
}, ref) => {
  const [opened, setOpened] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isClosingRef = useRef(false)

  const motionNotReduced = useReducedMotionConfig() !== true

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

  useEffect(() => {
    const cancel = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
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
  }, 30)

  useTimeoutEffect(() => {
    setOpened(true)
  }, 120)

  const styles = overlayCVA({
    level: overlayLevel as 0 | 1 | 2 | 3,
  })

  return (
    <m.dialog
      ref={useMergedRef(dialogRef, ref)}
      className={cx(RemoveScroll.classNames.fullWidth, styles.dialog, classes?.dialog, className)}
      layout
      style={{
        // @ts-ignore
        [cssVarLevel]: overlayLevel,
      }}
      {...motionNotReduced
        ? ({
          initial: {
            [backdropBlur]: '0px',
            [backdropOpacity]: '0%',
            scale: overlayLevel > 0 ? 0.9 : 1.075,
            opacity: 0,
          },
          animate: {
            [backdropBlur]: overlayLevel > 0 ? '4px' : '8px',
            [backdropOpacity]: overlayLevel > 0 ? '50%' : '60%',
            scale: 1,
            opacity: 1,
            transition: {
              delay: 0.075,
            },
          },
          exit: {
            scale: 1.2,
            opacity: 0,
            [backdropBlur]: '0px',
            [backdropOpacity]: '0%',
          },
        })
        : {
          initial: {
            [backdropBlur]: '8px',
            [backdropOpacity]: '60%',
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
        <Box className={cx(styles.body, 'overlay-body', classes?.body)}>
          {opened && <>{children}</>}
        </Box>
      </RemoveScroll>
    </m.dialog>
  )
})
Overlay.displayName = 'Overlay'
