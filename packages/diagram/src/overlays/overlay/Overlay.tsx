import { cx } from '@likec4/styles/css'
import { overlay } from '@likec4/styles/recipes'
import {
  RemoveScroll,
} from '@mantine/core'
import { useFocusTrap, useMergedRef } from '@mantine/hooks'
import { useTimeoutEffect } from '@react-hookz/web'
import { type TargetAndTransition, m, useIsPresent, useReducedMotionConfig } from 'motion/react'
import {
  type PropsWithChildren,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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
  /**
   * Delay before showing the overlay content (in milliseconds) - helps to avoid flickering
   * Default: `130ms`
   * If set to `0`, the content will be shown immediately
   */
  openDelay?: number
  /**
   * Called when the overlay is closed by outside click or escape key
   */
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
  // Initial state is false, will be set to true in useLayoutEffect if openDelay is 0
  const [opened, setOpened] = useState(false)
  const focusTrapRef = useFocusTrap(opened)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeReasonRef = useRef<'cancel' | 'external' | null>(null)

  const motionNotReduced = useReducedMotionConfig() !== true

  const isPresent = useIsPresent()

  const cancelMe = () => {
    closeReasonRef.current = 'cancel'
    onClose()
  }

  useEffect(() => {
    if (isPresent) {
      return
    }
    closeReasonRef.current ??= 'external'
    const dialog = dialogRef.current
    return () => {
      // Ensure the dialog is properly closed when unmounted, so the browser
      // removes it from the top layer. Without this, AnimatePresence can
      // remove the DOM node without calling dialog.close(), leaving a ghost
      // entry in the top layer that traps focus and blocks interaction. (#2353)
      if (dialog?.open) {
        dialog.close()
      }
    }
  }, [isPresent])

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
    // If openDelay is 0, open immediately
    if (openDelay === 0) {
      setOpened(true)
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

  const motionProps = useMemo(() => ({
    initial: {
      [backdropBlur]: '1px',
      [backdropOpacity]: '10%',
      scale: 0.95,
      opacity: 0,
    },
    animate: {
      [backdropBlur]: overlayLevel > 0 ? '4px' : '8px',
      [backdropOpacity]: targetBackdropOpacity,
      scale: 1,
      opacity: 1,
    },
    exit: {
      opacity: 0,
      scale: 0.97,
      [backdropBlur]: '0px',
      [backdropOpacity]: '0%',
    },
  } satisfies Record<string, TargetAndTransition>), [overlayLevel, targetBackdropOpacity])

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
      {...motionNotReduced ? motionProps : {
        initial: {
          [backdropBlur]: '8px',
          [backdropOpacity]: targetBackdropOpacity,
        },
      }}
      onDoubleClick={stopPropagation}
      onPointerDown={stopPropagation}
      {...rest}
      onClick={e => {
        e.stopPropagation()
        // Click on dialog backdrop (not the content) should close the overlay
        if ((e.target as any)?.nodeName?.toUpperCase() === 'DIALOG') {
          cancelMe()
        }
      }}
      onCancel={e => {
        // ESC key press - close the overlay
        e.preventDefault()
        e.stopPropagation()
        cancelMe()
      }}
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
