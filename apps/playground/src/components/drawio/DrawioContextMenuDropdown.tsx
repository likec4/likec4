import { Menu } from '@mantine/core'
import { IconFileExport } from '@tabler/icons-react'

const DROPDOWN_FONT_SIZE = '10px'
const ITEM_FONT_SIZE = '9px'

/** Props for DrawioContextMenuDropdown (position, open state, export callbacks, and capability flags). */
export type DrawioContextMenuDropdownProps = {
  menuPosition: { x: number; y: number }
  opened: boolean
  onClose: () => void
  onExport: () => void
  onExportAllViews?: () => void
  canExport: boolean
  canExportAllViews?: boolean
}

/**
 * Presentational component: DrawIO context menu dropdown (export only).
 * Logic is provided by useDrawioContextMenuActions.
 */
export function DrawioContextMenuDropdown({
  menuPosition,
  opened,
  onClose,
  onExport,
  onExportAllViews,
  canExport,
  canExportAllViews = false,
}: DrawioContextMenuDropdownProps) {
  return (
    <Menu
      opened={opened}
      onClose={onClose}
      position="bottom-start"
      withArrow
      shadow="md"
      closeOnItemClick
      styles={{
        dropdown: {
          position: 'fixed',
          left: menuPosition.x,
          top: menuPosition.y,
          fontSize: DROPDOWN_FONT_SIZE,
        },
        label: {
          fontSize: DROPDOWN_FONT_SIZE,
        },
        item: {
          fontSize: ITEM_FONT_SIZE,
        },
        itemLabel: {
          fontSize: ITEM_FONT_SIZE,
        },
      }}>
      <Menu.Target>
        <span
          style={{
            position: 'fixed',
            left: menuPosition.x,
            top: menuPosition.y,
            width: 1,
            height: 1,
            pointerEvents: 'none',
          }}
        />
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>DrawIO</Menu.Label>
        <Menu.Item
          leftSection={<IconFileExport size={16} />}
          onClick={onExportAllViews}
          disabled={!canExportAllViews}
          title="Export all views as one .drawio file (one tab per view). Use this to get all diagram tabs (e.g. Landscape + Our SaaS).">
          Export all…
        </Menu.Item>
        <Menu.Item
          leftSection={<IconFileExport size={16} />}
          onClick={onExport}
          disabled={!canExport}
          title="Export only the current view (single tab).">
          Export view…
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
