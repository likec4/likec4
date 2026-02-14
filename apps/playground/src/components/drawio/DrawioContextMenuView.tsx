import { Menu } from '@mantine/core'
import { IconFileExport, IconFileImport } from '@tabler/icons-react'

type DrawioContextMenuViewProps = {
  opened: boolean
  onClose: () => void
  menuPosition: { x: number; y: number }
  onImport: () => void
  onExport: () => void
  canExport: boolean
}

export function DrawioContextMenuView({
  opened,
  onClose,
  menuPosition,
  onImport,
  onExport,
  canExport,
}: DrawioContextMenuViewProps) {
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
  )
}
