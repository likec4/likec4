import { Menu } from '@mantine/core'
import { IconFileExport, IconFileImport } from '@tabler/icons-react'
import type { RefObject } from 'react'
import { DRAWIO_ACCEPT } from './useDrawioContextMenuActions'

export type DrawioContextMenuDropdownProps = {
  fileInputRef: RefObject<HTMLInputElement | null>
  menuPosition: { x: number; y: number }
  opened: boolean
  onClose: () => void
  onImport: () => void
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void
  onExport: () => void
  canExport: boolean
}

/**
 * Presentational component: DrawIO context menu dropdown and hidden file input.
 * Logic is provided by useDrawioContextMenuActions.
 */
export function DrawioContextMenuDropdown({
  fileInputRef,
  menuPosition,
  opened,
  onClose,
  onImport,
  onImportFile,
  onExport,
  canExport,
}: DrawioContextMenuDropdownProps) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={DRAWIO_ACCEPT}
        style={{ display: 'none' }}
        onChange={onImportFile}
        aria-hidden
      />
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
          <Menu.Item leftSection={<IconFileImport size={16} />} onClick={onImport}>
            Import from DrawIO…
          </Menu.Item>
          <Menu.Item
            leftSection={<IconFileExport size={16} />}
            onClick={onExport}
            disabled={!canExport}>
            Export to DrawIO
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  )
}
