import {
  type BoxProps,
  type ElementProps,
  type UnstyledButtonProps,
  Box,
  Group,
  rem,
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
    <UnstyledButton {...others} className={cx(classes.root, className)}>
      <Group gap="xs">
        <IconSearch style={{ width: rem(15), height: rem(15) }} stroke={2} />
        <Text fz="sm" fw="500" pr={50}>
          Search
        </Text>
        <Text fw={700} className={classes.shortcut}>
          {isMac ? '⌘ + K' : 'Ctrl + K'}
        </Text>
      </Group>
    </UnstyledButton>
  )
}
