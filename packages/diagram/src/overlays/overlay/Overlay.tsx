import { cx } from '@likec4/styles/css'
import { overlay } from '@likec4/styles/recipes'
import {
  RemoveScroll,
} from '@mantine/core'
import { useFocusTrap, useMergedRef } from '@mantine/hooks'
import { useDebouncedCallback, useTimeoutEffect } from '@react-hookz/web'
import { m, useReducedMotionConfig } from 'motion/react'
import { type PropsWithChildren, forwardRef, useLayoutEffect, useRef, useState } from 'react'
import { stopPropagation } from '../../utils'

const backdropBlur = '--_blur'
const backdropOpacity = '--_opacity'
const cssVarLevel = '--_level'

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
  const focusTrapRef = useFocusTrap(opened)
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

  const overlayRecipe = overlay({
    fullscreen,
    withBackdrop,
  })

  let targetBackdropOpacity = overlayLevel > 0 ? '50%' : '60%'
  if (backdrop?.opacity !== undefined) {
    targetBackdropOpacity = `${backdrop.opacity * 100}%`
  }
  return (
    <m.dialog
      ref={useMergedRef(
        dialogRef,
        focusTrapRef,
        ref,
      )}
      className={cx(
        classes?.dialog,
        className,
        overlayRecipe,
        // styles.dialog,
        fullscreen && RemoveScroll.classNames.fullWidth,
      )}
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
      <RemoveScroll forwardProps>
        <div
          className={cx(
            classes?.body,
            'likec4-overlay-body',
          )}>
          {opened && <>{children}</>}
        </div>
      </RemoveScroll>
    </m.dialog>
  )
})
Overlay.displayName = 'Overlay'
