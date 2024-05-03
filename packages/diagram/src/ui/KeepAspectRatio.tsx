import { Box } from '@mantine/core'
import clsx from 'clsx'
import type { HTMLAttributes } from 'react'
import { wrapper } from './KeepAspectRatio.css'

type KeepAspectRatioProps = HTMLAttributes<HTMLDivElement> & {
  enabled: boolean
  width: number
  height: number
}

export function KeepAspectRatio({
  children,
  width,
  height,
  enabled,
  className,
  style,
  ...rest
}: KeepAspectRatioProps) {
  return (
    <Box
      {...rest}
      className={clsx(wrapper, className)}
      style={enabled
        ? {
          ...style,
          aspectRatio: `${Math.ceil(width)}/${Math.ceil(height)}`,
          maxHeight: Math.ceil(height)
        }
        : style}>
      {children}
    </Box>
  )
}
