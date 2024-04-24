import { Button, rem } from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'

export const CopyButtonChild = ({ copied, copy }: { copied: boolean; copy: () => void }) => (
  <Button
    size="xs"
    color={copied ? 'teal' : 'gray'}
    variant={'light'}
    leftSection={copied
      ? <IconCheck style={{ width: rem(16) }} />
      : <IconCopy style={{ width: rem(16) }} />}
    onClick={copy}>
    {copied ? 'Copied' : 'Copy to clipboard'}
  </Button>
)
