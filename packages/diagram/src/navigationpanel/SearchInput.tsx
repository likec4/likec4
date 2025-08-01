import { css } from '@likec4/styles/css'
import { Button, Input, rem } from '@mantine/core'
import { useUncontrolled } from '@mantine/hooks'
import { IconSearch } from '@tabler/icons-react'
import type { KeyboardEventHandler } from 'react'
import { isEmpty } from 'remeda'

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
      placeholder="Search by title or id"
      variant="unstyled"
      height={rem(26)}
      value={_value}
      onKeyDown={onKeyDown}
      onChange={e => handleChange(e.currentTarget.value)}
      classNames={{
        wrapper: css({
          flexGrow: 1,
          backgroundColor: {
            base: 'mantine.colors.gray[1]',
            _dark: 'mantine.colors.dark[5]/80',
            _hover: {
              base: 'mantine.colors.gray[2]',
              _dark: 'mantine.colors.dark[4]',
            },
            _focus: {
              base: 'mantine.colors.gray[2]',
              _dark: 'mantine.colors.dark[4]',
            },
          },
          rounded: 'sm',
        }),
        input: css({
          _placeholder: {
            color: 'mantine.colors.dimmed',
          },
          _focus: {
            outline: 'none',
          },
        }),
      }}
      style={{
        ['--input-fz']: 'var(--mantine-font-size-sm)',
      }}
      leftSection={<IconSearch size={14} />}
      rightSectionPointerEvents="all"
      rightSectionWidth={'min-content'}
      rightSection={!props.value || isEmpty(props.value)
        ? null
        : (
          <Button
            variant="subtle"
            h="100%"
            size={'compact-xs'}
            color="gray"
            onClick={(e) => {
              e.stopPropagation()
              handleChange('')
            }}
          >
            clear
          </Button>
        )}
    />
  )
}
