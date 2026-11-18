import { css } from '@likec4/styles/css'
import { Badge, UnstyledButton } from '@mantine/core'
import type { ReactNode } from 'react'

export function MetadataProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export type MetadataEntries = ReadonlyArray<readonly [key: string, value: string | readonly string[]]>

/**
 * Splits a metadata value into separate values:
 * arrays as is, multiline strings by line.
 */
export function metadataValues(value: string | readonly string[]): string[] {
  if (typeof value !== 'string') {
    return [...value]
  }
  return value.includes('\n') ? value.split('\n').map(s => s.trim()).filter(Boolean) : [value]
}

const list = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2.5',
  width: '100%',
})

// key and its values on one line, wrapping when values are long
const row = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  columnGap: '2',
  rowGap: '1',
})

const keyButton = css({
  maxWidth: '[160px]',
  borderRadius: 'sm',
  fontSize: 'xs',
  fontWeight: 'medium',
  // neutral, same scale as field labels (text.dimmed is a cool gray and clashes with the badges)
  color: 'text/55',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  transition: 'fast',
  _hover: {
    color: 'text.link',
    backgroundColor: 'surface.hover',
  },
})

const values = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1',
  minWidth: '0',
})

const chip = css({
  minHeight: '[24px]',
  maxWidth: '100%',
  backgroundColor: {
    base: 'transparent',
    _hover: {
      base: 'mantine.gray[1]',
      _dark: 'mantine.dark[5]',
    },
  },
})

const chipLabel = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

const chipButton = css({
  // inherit badge typography (UnstyledButton sets its own font-size)
  fontSize: '[inherit]',
  fontWeight: '[inherit]',
  lineHeight: '[inherit]',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: '[var(--badge-color)]',
  // values lead: brighter than the keys
  opacity: {
    base: '0.9',
    _hover: '1',
  },
  transition: 'fast',
})

type MetadataListProps = {
  entries: MetadataEntries
  /**
   * Called when a key (`value` is undefined) or a key-value pair is clicked
   */
  onSearch: (key: string, value?: string) => void
}

/**
 * Metadata as compact rows: key followed by its values.
 * Keys and values are clickable, to find other elements with the same metadata.
 */
export function MetadataList({ entries, onSearch }: MetadataListProps) {
  return (
    <div className={list}>
      {entries.map(([key, value]) => (
        <div key={key} className={row}>
          <UnstyledButton
            className={keyButton}
            title={`Find elements with "${key}"`}
            onClick={e => {
              e.stopPropagation()
              onSearch(key)
            }}>
            {key}
          </UnstyledButton>
          <div className={values}>
            {metadataValues(value).map((v, i) => (
              <Badge
                key={i}
                variant="default"
                radius="sm"
                size="sm"
                tt="none"
                classNames={{ root: chip, label: chipLabel }}
              >
                <UnstyledButton
                  className={chipButton}
                  title={`Find elements with ${key}: ${v}`}
                  onClick={e => {
                    e.stopPropagation()
                    onSearch(key, v)
                  }}>
                  {v}
                </UnstyledButton>
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
