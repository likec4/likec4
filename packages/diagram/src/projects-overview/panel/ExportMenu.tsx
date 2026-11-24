import { Button, Menu } from '@mantine/core'
import { IconChevronDown, IconDownload } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'
import { type ProjectsOverviewExportFormat, type ProjectsOverviewExports, availableExportFormats } from '../exports'

type FormatEntry = {
  readonly label: string
  readonly action: ProjectsOverviewExportFormat
}

const entries: readonly FormatEntry[] = [
  { action: 'png', label: 'Export as .png' },
  { action: 'jpg', label: 'Export as .jpg' },
  { action: 'dot', label: 'Export as .dot' },
  { action: 'd2', label: 'Export as .d2' },
  { action: 'mmd', label: 'Export as .mmd' },
  { action: 'puml', label: 'Export as .puml' },
  { action: 'drawio', label: 'Export to Draw.io' },
]

/**
 * Export menu with the formats of the host app, same as the export menu of other views.
 * Renders nothing when no format is available.
 */
export function ExportMenu({ exports, onExport }: {
  exports: ProjectsOverviewExports
  onExport: (format: ProjectsOverviewExportFormat) => void
}): ReactNode {
  const portalProps = useMantinePortalProps()
  const available = new Set(availableExportFormats(exports))
  if (available.size === 0) {
    return null
  }
  return (
    <Menu shadow="md" width={200} position="top-start" {...portalProps}>
      <Menu.Target>
        <Button
          size="xs"
          variant="default"
          leftSection={<IconDownload size={14} />}
          rightSection={<IconChevronDown size={12} opacity={0.6} />}
        >
          Export
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {entries.filter(entry => available.has(entry.action)).map(entry => (
          <Menu.Item
            key={entry.action}
            fz="sm"
            onClick={() => onExport(entry.action)}>
            {entry.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}
