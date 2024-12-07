import { Box, Code } from '@mantine/core'

export const ViewNotFound = ({ viewId }: { viewId: string }) => (
  <Box
    style={{
      margin: '1rem 0'
    }}>
    <div
      style={{
        margin: '0 auto',
        display: 'inline-block',
        padding: '2rem',
        background: 'rgba(250,82,82,.15)',
        color: '#ffa8a8'
      }}>
      View <Code>{viewId}</Code> not found
    </div>
  </Box>
)
