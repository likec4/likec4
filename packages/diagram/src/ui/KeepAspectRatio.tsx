import { Box } from '@mantine/core'
import type { PropsWithChildren } from 'react'
import { wrapper } from './KeepAspectRatio.css'

export function KeepAspectRatio({
  children,
  width,
  height,
  enabled
}: PropsWithChildren<{
  enabled: boolean
  width: number
  height: number
}>) {
  if (!enabled) {
    return <>{children}</>
  }
  return (
    <Box
      className={wrapper}
      style={{
        aspectRatio: `${width}/${height}`,
        maxWidth: width
      }}>
      {children}
    </Box>
  )
}
