import { Menu, SegmentedControl } from '@mantine/core'
import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import * as styles from './styles'

export interface SortOption<T extends string> {
  readonly value: T
  readonly label: string
}

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
        <button type="button" className={styles.sortButton} aria-label={label}>
          Sort: {options.find(o => o.value === value)?.label}
          <IconChevronDown size={14} aria-hidden />
        </button>
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
          <span className={styles.modeLabel}>
            {mode.icon}
            {mode.label}
          </span>
        ),
      }))}
    />
  )
}
