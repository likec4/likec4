import type { Link as LinkData } from '@likec4/core'
import { css, cva, cx } from '@likec4/styles/css'
import { ActionIcon, Anchor, Box, CopyButton, Text } from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { stopPropagation } from '../utils'

const link = cva({
  base: {
    display: 'flex',
    overflow: 'hidden',
    alignItems: 'center',
    gap: 'micro',
    justifyContent: 'stretch',
    transitionProperty: 'all',
    transitionDuration: 'fast',
    transitionTimingFunction: 'in-out',
    border: `1px dashed {colors.mantine.colors.defaultBorder}`,
    rounded: 'sm',
    cursor: 'pointer',
    color: 'mantine.colors.gray[7]',
    _dark: {
      color: 'mantine.colors.dark[1]',
    },
    _hover: {
      transitionTimingFunction: 'out',
      color: 'mantine.colors.defaultColor',
      background: 'mantine.colors.defaultHover',
    },
  },
  variants: {
    size: {
      sm: {
        minHeight: '22px',
        padding: '2px 8px 2px 2px',
      },
      md: {
        minHeight: '30px',
        padding: '3px 16px 3px 3px',
      },
    },
  },
})

const titleBox = css({
  flex: '1 1 100%',
  transition: `transform 100ms {easings.inOut}`,
  _groupHover: {
    transitionTimingFunction: 'out',
    transitionDelay: '50ms',
    transform: 'translateX(1px)',
  },
})

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
          className={cx(
            'group',
            link({ size }),
          )}
          onClick={stopPropagation}>
          <ActionIcon
            className={css({
              flex: '0',
            })}
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
          <Box className={titleBox}>
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
