import { styled } from '@likec4/styles/jsx'
import { Menu, SegmentedControl } from '@mantine/core'
import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import type { ReactNode } from 'react'

export interface SortOption<T extends string> {
  readonly value: T
  readonly label: string
}

const SortButton = styled('button', {
  base: {
    height: '[32px]',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    paddingLeft: '3',
    paddingRight: '2',
    borderRadius: 'sm',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'border.subtle',
    backgroundColor: 'surface.field',
    color: 'text',
    fontFamily: 'body',
    fontSize: 'sm',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    _hover: {
      borderColor: 'border.default',
    },
    _focus: {
      outline: 'none',
      borderColor: 'primary.border',
      boxShadow: '[0 0 0 1px var(--colors-primary-border)]',
    },
    '&[aria-expanded="true"]': {
      borderColor: 'border.default',
    },
    '& > svg': {
      color: 'text.dimmed',
    },
  },
})

/**
 * Field-like button with a menu of sort options, the current one checked
 */
export function SortMenu<T extends string>({ options, value, onChange, label }: {
  options: ReadonlyArray<SortOption<T>>
  value: T
  onChange: (value: T) => void
  /**
   * Menu heading and accessible name, e.g. "Sort projects by"
   */
  label: string
}) {
  return (
    <Menu position="bottom-start" width={200} shadow="md" withinPortal>
      <Menu.Target>
        <SortButton type="button" aria-label={label}>
          Sort: {options.find(o => o.value === value)?.label}
          <IconChevronDown size={14} aria-hidden />
        </SortButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{label}</Menu.Label>
        {options.map(o => (
          <Menu.Item
            key={o.value}
            onClick={() => onChange(o.value)}
            rightSection={o.value === value ? <IconCheck size={14} aria-hidden /> : null}
            aria-checked={o.value === value}
            role="menuitemradio">
            {o.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}

export interface ViewModeOption<T extends string> {
  readonly value: T
  readonly label: string
  readonly icon: ReactNode
}

/**
 * Icon + text inside a SegmentedControl item: a block-level flex box, so it is centred
 * in the item instead of sitting on the text baseline
 */
const ModeLabel = styled('span', {
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5',
    lineHeight: '1',
    '& > svg': {
      display: 'block',
      flexShrink: '0',
    },
  },
})

/**
 * Switch between the page's views (cards, table, ...)
 */
export function ViewModeSwitch<T extends string>({ modes, value, onChange }: {
  modes: ReadonlyArray<ViewModeOption<T>>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <SegmentedControl
      size="sm"
      aria-label="View"
      value={value}
      onChange={next => {
        const mode = modes.find(m => m.value === next)
        if (mode) onChange(mode.value)
      }}
      data={modes.map(mode => ({
        value: mode.value,
        label: (
          <ModeLabel>
            {mode.icon}
            {mode.label}
          </ModeLabel>
        ),
      }))}
    />
  )
}
