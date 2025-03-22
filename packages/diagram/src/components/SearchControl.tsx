import {
  type ElementProps,
  type UnstyledButtonProps,
  Group,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { isMacOs } from '@xyflow/system'
import cx from 'clsx'
import * as classes from './SearchControl.css'

interface SearchControlProps extends UnstyledButtonProps, ElementProps<'button'> {}

export function SearchControl({ className, ...others }: SearchControlProps) {
  const isMac = isMacOs()
  return (
    <UnstyledButton {...others} className={cx('group', classes.root, className)}>
      <Group gap="xs">
        <IconSearch style={{ width: '15px', height: '15px' }} stroke={2} />
        <Text component="div" className={classes.placeholder}>
          Search
        </Text>
        <Text component="div" className={classes.shortcut}>
          {isMac ? '⌘ + K' : 'Ctrl + K'}
        </Text>
      </Group>
    </UnstyledButton>
  )
}
