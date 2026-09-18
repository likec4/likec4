import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { floatingWindow } from '@likec4/styles/recipes'
import {
  type FloatingWindowProps as MantineFloatingWindowProps,
  CloseButton,
  FloatingWindow as MantineFloatingWindow,
} from '@mantine/core'
import { useSessionStorage } from '@mantine/hooks'
import { useRafCallback } from '@react-hookz/web'
import { useRef } from 'react'
import { useId, useMantinePortalProps } from '../hooks'

export interface FloatingWindowProps extends MantineFloatingWindowProps {
  /**
   * To make window position and size persistent, provide a stable id
   */
  windowId?: string | null
  /**
   * If true, the window will not be resizable
   * @default false
   */
  nonResizeable?: boolean
  /**
   * Callback when the window is closed
   * If provided, the window will render a close button
   */
  onClose?: () => void
}

export function FloatingWindow({
  children,
  windowId,
  onClose,
  dimensions,
  initialPosition,
  className,
  nonResizeable = false,
  ...props
}: FloatingWindowProps) {
  const portalProps = useMantinePortalProps()
  const id = useId()
  const storageKey = windowId ?? id

  const [windowState, setWindowState] = useSessionStorage<
    Pick<MantineFloatingWindowProps, 'dimensions' | 'initialPosition'>
  >({
    key: `likec4:window:${storageKey}`,
    getInitialValueInEffect: false,
    defaultValue: {
      dimensions: {
        minWidth: 220,
        minHeight: 250,
        initialWidth: 260,
        initialHeight: 360,
        ...dimensions,
      },
      initialPosition: {
        top: 65,
        left: 32,
        ...initialPosition,
      },
    },
  })

  // Store initial state in ref on first render
  const initialStateRef = useRef(windowState)

  // Update ref when windowState changes
  const [updateWindowState] = useRafCallback(
    (update: Pick<MantineFloatingWindowProps, 'dimensions' | 'initialPosition'>) => {
      setWindowState((state) => ({
        dimensions: {
          ...state.dimensions,
          ...update.dimensions,
        },
        initialPosition: {
          ...state.initialPosition,
          ...update.initialPosition,
        },
      }))
    },
  )

  return (
    <MantineFloatingWindow
      constrainToViewport
      constrainOffset={4}
      dragHandleSelector=".drag-handle"
      excludeDragHandleSelector="button, .nodrag, .mantine-ScrollArea-root"
      className={cx(floatingWindow(), className)}
      {...portalProps}
      {...props}
      {...initialStateRef.current}
      onPositionChange={(position) => {
        updateWindowState({
          initialPosition: {
            top: position.y,
            left: position.x,
          },
        })
        props.onPositionChange?.(position)
      }}
      onSizeChange={(size) => {
        updateWindowState({
          dimensions: {
            initialHeight: size.height,
            initialWidth: size.width,
          },
        })
        props.onSizeChange?.(size)
      }}
    >
      {children}
      {!nonResizeable && (
        <>
          <MantineFloatingWindow.ResizeHandle data-resize-handler="right" tabIndex={-1} />
          <MantineFloatingWindow.ResizeHandle data-resize-handler="bottom" />
        </>
      )}
      <Box className="drag-header drag-handle" pr={'1'}>
        {onClose && (
          <CloseButton
            size={16}
            onClick={onClose} />
        )}
      </Box>
    </MantineFloatingWindow>
  )
}
