import {
  Box,
  RemoveScroll,
} from '@mantine/core'
import { useMergedRef } from '@mantine/hooks'
import { useDebouncedCallback, useSyncedRef } from '@react-hookz/web'
import clsx from 'clsx'
import { type HTMLMotionProps, m } from 'framer-motion'
import { type PropsWithChildren, forwardRef, useRef, useState } from 'react'
import * as css from './Overlay.css'

type OverlayProps = PropsWithChildren<
  HTMLMotionProps<'dialog'> & {
    onClose: () => void
    onClick?: never
  }
>

export const Overlay = forwardRef<HTMLDialogElement, OverlayProps>(({ children, onClose, className, ...rest }, ref) => {
  const [opened, setOpened] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Move dialog to the top of the DOM
  // useLayoutEffect(() => dialogRef.current?.showModal(), [])

  const onCloseRef = useSyncedRef(onClose)
  const close = useDebouncedCallback(
    () => {
      onCloseRef.current()
    },
    [],
    50,
  )

  return (
    <m.dialog
      ref={useMergedRef(ref, dialogRef)}
      className={clsx(css.dialog, className)}
      initial={{
        '--backdrop-blur': '0px',
        '--backdrop-opacity': '10%',
        translateY: -8,
        // opacity: 0.8,
      }}
      animate={{
        '--backdrop-blur': '3px',
        '--backdrop-opacity': '60%',
        translateY: 0,
        // opacity: 1,
        // transition: {
        //   delay: 0.25,
        // }
      }}
      onAnimationStart={() => {
        dialogRef.current?.showModal()
        setOpened(true)
      }}
      exit={{
        opacity: 0.1,
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
})
