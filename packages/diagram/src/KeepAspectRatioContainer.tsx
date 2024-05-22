import { Box } from '@mantine/core'
import clsx from 'clsx'
import { type HTMLAttributes, useId } from 'react'
import * as css from './LikeC4Diagram.css'

type KeepAspectRatioContainerProps = HTMLAttributes<HTMLDivElement> & {
  // Whether to keep the aspect ratio
  enabled: boolean
  width: number
  height: number
}

export function KeepAspectRatioContainer({
  children,
  width,
  height,
  enabled,
  className,
  style,
  ...rest
}: KeepAspectRatioContainerProps) {
  return (
    <Box
      {...rest}
      className={clsx(css.keepAspectRatioContainer, className)}
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
