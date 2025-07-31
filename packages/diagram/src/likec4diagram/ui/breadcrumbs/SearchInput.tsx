import { css } from '@likec4/styles/css'
import { Input, rem, ThemeIcon } from '@mantine/core'
import { useUncontrolled } from '@mantine/hooks'
import { IconSearch } from '@tabler/icons-react'
import type { KeyboardEventHandler } from 'react'

export function SearchInput({ onKeyDown, ...props }: {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onKeyDown?: KeyboardEventHandler<HTMLElement>
}) {
  const [_value, handleChange] = useUncontrolled({
    ...props,
    finalValue: '',
  })
  return (
    <Input
      size="xs"
      placeholder="Search"
      variant="unstyled"
      height={rem(26)}
      value={_value}
      onKeyDown={onKeyDown}
      onChange={e => handleChange(e.currentTarget.value)}
      classNames={{
        wrapper: css({
          backgroundColor: {
            base: 'mantine.colors.gray[0]',
            _dark: 'mantine.colors.dark[5]/80',
            _hover: {
              base: 'mantine.colors.gray[1]',
              _dark: 'mantine.colors.dark[4]',
            },
            _focus: {
              base: 'mantine.colors.gray[1]',
              _dark: 'mantine.colors.dark[4]',
            },
          },
          rounded: 'sm',
        }),
        input: css({
          _focus: {
            outline: 'none',
          },
        }),
      }}
      style={{
        ['--input-fz']: 'var(--mantine-font-size-sm)',
      }}
      leftSection={
        <ThemeIcon variant="transparent" size={14} c="dimmed">
          <IconSearch />
        </ThemeIcon>
      }
    />
  )
}
