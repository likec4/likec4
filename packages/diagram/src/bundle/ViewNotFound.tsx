import { Box, Code } from '@mantine/core'
import type { PropsWithChildren } from 'react'

export const ErrorMessage = ({ children }: PropsWithChildren) => (
  <Box
    style={{
      margin: '1rem 0',
    }}>
    <div
      style={{
        margin: '0 auto',
        display: 'inline-block',
        padding: '2rem',
        background: 'rgba(250,82,82,.15)',
        color: '#ffa8a8',
      }}>
      {children}
    </div>
  </Box>
)

export const ViewNotFound = ({ viewId }: { viewId: string }) => (
  <ErrorMessage>
    View <Code>{viewId}</Code> not found
  </ErrorMessage>
)
