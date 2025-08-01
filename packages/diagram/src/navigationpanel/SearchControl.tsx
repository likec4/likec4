import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import {
  type ElementProps,
  type UnstyledButtonProps,
  UnstyledButton,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { isMacOs } from '@xyflow/system'
import { useDiagram } from '../hooks/useDiagram'

interface SearchControlProps extends UnstyledButtonProps, ElementProps<'button'> {}

export function SearchControl({ className, ...others }: SearchControlProps) {
  const diagram = useDiagram()
  const isMac = isMacOs()

  return (
    <UnstyledButton
      onClick={e => {
        e.stopPropagation()
        diagram.openSearch()
      }}
      {...others}
      className={cx(
        className,
        'group',
        'mantine-active',
        hstack({
          gap: '2xs',
          paddingInline: 'sm',
          paddingBlock: '2xs',
          rounded: 'sm',
          userSelect: 'none',
          cursor: 'pointer',
          color: {
            base: 'mantine.colors.dark.lightColor',
            _dark: 'mantine.colors.text/80',
            _hover: {
              base: 'mantine.colors.dark.lightColor',
              _dark: 'mantine.colors.text',
            },
          },
          backgroundColor: {
            base: 'mantine.colors.gray[1]',
            _dark: 'mantine.colors.dark[7]/70',
            _hover: {
              base: 'mantine.colors.gray[2]',
              _dark: 'mantine.colors.dark[8]',
            },
          },
          // backgroundColor: {
          //   base: 'mantine.colors.dark.light/80',
          //   _dark: 'mantine.colors.dark[7]/70',
          //   _hover: {
          //     base: 'mantine.colors.dark.lightHover/80',
          //     _dark: 'mantine.colors.dark[8]',
          //   },
          // },
        }),
      )}>
      <IconSearch size={14} stroke={2.5} />
      <Box
        css={{
          fontSize: '11px',
          fontWeight: 600,
          lineHeight: 1,
          opacity: 0.8,
        }}>
        {isMac ? '⌘ + K' : 'Ctrl + K'}
      </Box>
    </UnstyledButton>
  )
}
