import { ActionIcon, Box, CopyButton as MantineCopyButton, rem, Tooltip } from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'

type CopyToClipboardProps = {
  text: string
}

export function CopyButton({ text }: CopyToClipboardProps) {
  return (
    <MantineCopyButton value={text} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
          <ActionIcon color={copied ? 'teal' : 'gray'} variant={copied ? 'light' : 'subtle'} onClick={copy}>
            {copied ? <IconCheck style={{ width: rem(16) }} /> : <IconCopy style={{ width: rem(16) }} />}
          </ActionIcon>
        </Tooltip>
      )}
    </MantineCopyButton>
  )
}

export function CopyToClipboard({ text }: CopyToClipboardProps) {
  return (
    <Box pos={'absolute'} top={'0'} right={'0'} p={'4'}>
      <CopyButton text={text} />
    </Box>
  )
}
