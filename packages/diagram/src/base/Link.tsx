import type { Link as LinkData } from '@likec4/core'
import { ActionIcon, Anchor, Box, CopyButton, Text } from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { stopPropagation } from '../utils'
import * as css from './Link.css'

export function Link({
  value,
  size = 'md',
}: {
  size?: 'sm' | 'md'
  value: LinkData
}) {
  const isNormalSize = size === 'md'
  const url = new URL(value.url, window.location.href).toString()
  return (
    <CopyButton value={url}>
      {({ copied, copy }) => (
        <Anchor
          href={url}
          target="_blank"
          underline="never"
          className={css.elementLink}
          data-size={size}
          onClick={stopPropagation}>
          <ActionIcon
            className={css.linkIcon}
            tabIndex={-1}
            size={isNormalSize ? 24 : 20}
            variant={copied ? 'light' : 'subtle'}
            color={copied ? 'teal' : 'gray'}
            onClick={e => {
              e.stopPropagation()
              e.preventDefault()
              copy()
            }}
          >
            {copied ? <IconCheck /> : <IconCopy style={{ width: '65%', opacity: 0.65 }} />}
          </ActionIcon>
          <Box className={css.linkTitleBox}>
            <Text
              component="div"
              fz={isNormalSize ? 'xs' : 11}
              truncate
              lh={isNormalSize ? 1.3 : 1.2}
              fw={value.title ? 500 : 400}>
              {value.title || url}
            </Text>
            {value.title && (
              <Text component="div" fz={isNormalSize ? 10 : 9} c={'dimmed'} lh={isNormalSize ? 1.2 : 1.1} truncate>
                {url}
              </Text>
            )}
          </Box>
        </Anchor>
      )}
    </CopyButton>
  )
  // <Anchor href={value.url} fz={'sm'}>
  //   {value.title || url}
  // </Anchor><Button variant='default' size='sm'>
  //     {value.title || value.url}
  //   </Button>
  //  </Box>
  // )
}
