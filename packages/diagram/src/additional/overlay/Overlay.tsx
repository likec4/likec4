import {
  Box,
  RemoveScroll,
} from '@mantine/core'
import { useDebouncedEffect } from '@react-hookz/web'
import { m } from 'framer-motion'
import { type PropsWithChildren, useLayoutEffect, useRef, useState } from 'react'
import * as css from './Overlay.css'

type OverlayProps = PropsWithChildren<{
  onClose: () => void
}>

export function Overlay({ children, onClose }: OverlayProps) {
  const [opened, setOpened] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)

  useLayoutEffect(() => ref.current?.showModal(), [])

  useDebouncedEffect(
    () => setOpened(true),
    [],
    50,
  )

  return (
    <m.dialog
      ref={ref}
      className={css.dialog}
      initial={{
        '--backdrop-blur': '0px',
        '--backdrop-opacity': '0%',
        translateY: -10,
        opacity: 0.5,
      }}
      animate={{
        '--backdrop-blur': '3px',
        '--backdrop-opacity': '60%',
        translateY: 0,
        opacity: 1,
        scale: 1,
        // transition: {
        //   delay: 0.25,
        // }
      }}
      exit={{
        opacity: 0.1,
        translateY: -40,
        '--backdrop-blur': '0px',
        '--backdrop-opacity': '0%',
        transition: {
          duration: 0.17,
        },
      }}
      onClick={e => {
        if ((e.target as any)?.nodeName?.toUpperCase() === 'DIALOG') {
          e.stopPropagation()
          onClose()
        }
      }}
      onClose={e => {
        e.stopPropagation()
        onClose()
      }}
    >
      <RemoveScroll forwardProps>
        <Box className={css.body}>
          {opened && <>{children}</>}
        </Box>
      </RemoveScroll>
    </m.dialog>
  )
}
