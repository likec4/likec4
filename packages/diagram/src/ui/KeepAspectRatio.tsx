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
  if (!enabled) {
    return <>{children}</>
  }
  return (
    <Box
      {...rest}
      className={clsx(wrapper, className)}
      style={{
        ...style,
        aspectRatio: `${width}/${height}`,
        maxWidth: width
      }}>
      {children}
    </Box>
  )
}
