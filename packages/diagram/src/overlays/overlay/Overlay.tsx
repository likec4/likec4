import { cx } from '@likec4/styles/css'
import {
  RemoveScroll,
} from '@mantine/core'
import { useMergedRef } from '@mantine/hooks'
import { useDebouncedCallback, useTimeoutEffect } from '@react-hookz/web'
import { m, useReducedMotionConfig } from 'motion/react'
import { type PropsWithChildren, forwardRef, useLayoutEffect, useRef, useState } from 'react'
import { stopPropagation } from '../../utils'
import { backdropBlur, backdropOpacity, level as cssVarLevel, overlay as overlayCVA } from './Overlay.css'

export type OverlayProps = PropsWithChildren<{
  fullscreen?: boolean | undefined
  withBackdrop?: boolean | undefined
  overlayLevel?: number
  className?: string
  classes?: {
    dialog?: string
    body?: string
  }
  backdrop?: {
    opacity?: number
  }
  openDelay?: number
  onClose: () => void
  onClick?: never
}>

export const Overlay = forwardRef<HTMLDialogElement, OverlayProps>(({
  onClose,
  className,
  classes,
  overlayLevel = 0,
  children,
  fullscreen = false,
  withBackdrop = true,
  backdrop,
  openDelay = 130,
  ...rest
}, ref) => {
  const [opened, setOpened] = useState(openDelay === 0)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isClosingRef = useRef(false)

  const motionNotReduced = useReducedMotionConfig() !== true

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

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
    if (!dialogRef.current?.open) {
      // Move dialog to the top of the DOM
      dialogRef.current?.showModal()
    }
  }, [])

  useTimeoutEffect(() => {
    setOpened(true)
  }, openDelay > 0 ? openDelay : undefined)

  const styles = overlayCVA({
    fullscreen,
    withBackdrop,
  })

  let targetBackdropOpacity = overlayLevel > 0 ? '50%' : '60%'
  if (backdrop?.opacity !== undefined) {
    targetBackdropOpacity = `${backdrop.opacity * 100}%`
  }
  return (
    <m.dialog
      ref={useMergedRef(dialogRef, ref)}
      className={cx(RemoveScroll.classNames.fullWidth, classes?.dialog, className, styles.dialog)}
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
            scale: 0.95,
            originY: 0,
            translateY: -20,
            opacity: 0,
          },
          animate: {
            [backdropBlur]: overlayLevel > 0 ? '4px' : '8px',
            [backdropOpacity]: targetBackdropOpacity,
            scale: 1,
            opacity: 1,
            translateY: 0,
            transition: {
              delay: 0.075,
            },
          },
          exit: {
            opacity: 0,
            scale: 0.98,
            translateY: -20,
            transition: {
              duration: 0.1,
            },
            [backdropBlur]: '0px',
            [backdropOpacity]: '0%',
          },
        })
        : {
          initial: {
            [backdropBlur]: '8px',
            [backdropOpacity]: targetBackdropOpacity,
          },
        }}
      onClick={e => {
        e.stopPropagation()
        if ((e.target as any)?.nodeName?.toUpperCase() === 'DIALOG') {
          dialogRef.current?.close()
          return
        }
      }}
      onCancel={e => {
        e.preventDefault()
        e.stopPropagation()
        close()
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
        <div className={cx(classes?.body, styles.body, 'overlay-body')}>
          {opened && <>{children}</>}
        </div>
      </RemoveScroll>
    </m.dialog>
  )
})
Overlay.displayName = 'Overlay'
