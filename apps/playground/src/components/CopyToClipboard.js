import { ActionIcon, Box, CopyButton as MantineCopyButton, rem, Tooltip } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
export function CopyButton({ text }) {
    return (<MantineCopyButton value={text} timeout={2000}>
      {({ copied, copy }) => (<Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
          <ActionIcon color={copied ? 'teal' : 'gray'} variant={copied ? 'light' : 'subtle'} onClick={copy}>
            {copied ? <IconCheck style={{ width: rem(16) }}/> : <IconCopy style={{ width: rem(16) }}/>}
          </ActionIcon>
        </Tooltip>)}
    </MantineCopyButton>);
}
export function CopyToClipboard({ text }) {
    return (<Box pos={'absolute'} top={'0'} right={'0'} p={'4'}>
      <CopyButton text={text}/>
    </Box>);
}
