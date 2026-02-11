import { usePlayground } from '$/hooks/usePlayground'
import { generateDrawio, parseDrawioToLikeC4 } from '@likec4/generators'
import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import { Menu } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconFileImport, IconFileExport } from '@tabler/icons-react'
import { useRef, useCallback, useState } from 'react'

const DRAWIO_ACCEPT = '.drawio,.drawio.xml,application/x-drawio'

type DrawioContextMenuProps = {
  /** Render prop: pass the context menu handler to the diagram's onCanvasContextMenu */
  children: (onCanvasContextMenu: (event: React.MouseEvent) => void) => React.ReactNode
  /** Current diagram view (for export). Must be layouted. */
  diagram: DiagramView | null
  /** Model for $styles when exporting */
  likec4model: LikeC4Model | null
}

/**
 * Provides DrawIO Import / Export actions and renders a context menu
 * that opens on the given onContextMenu event.
 */
export function DrawioContextMenu({
  children,
  diagram,
  likec4model,
}: DrawioContextMenuProps) {
  const playground = usePlayground()
  const [opened, { open, close }] = useDisclosure(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCanvasContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setMenuPosition({ x: event.clientX, y: event.clientY })
    open()
  }, [open])

  const handleImport = useCallback(() => {
    close()
    fileInputRef.current?.click()
  }, [close])

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      e.target.value = ''
      const reader = new FileReader()
      reader.onload = () => {
        const xml = reader.result as string
        try {
          const likec4Source = parseDrawioToLikeC4(xml)
          const base = file.name.replace(/\.drawio(\.xml)?$/i, '')
          const filename = `${base}.c4`
          playground.actor.send({
            type: 'workspace.addFile',
            filename,
            content: likec4Source,
          })
        } catch (err) {
          console.error('DrawIO import failed', err)
        }
      }
      reader.readAsText(file, 'utf-8')
    },
    [playground],
  )

  const handleExport = useCallback(() => {
    close()
    if (!diagram) return
    try {
      const viewmodel = {
        $view: diagram,
        get $styles() {
          return likec4model?.$styles ?? null
        },
      }
      const xml = generateDrawio(viewmodel as Parameters<typeof generateDrawio>[0])
      const blob = new Blob([xml], { type: 'application/x-drawio' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${diagram.id}.drawio`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('DrawIO export failed', err)
    }
  }, [close, diagram, likec4model])

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={DRAWIO_ACCEPT}
        style={{ display: 'none' }}
        onChange={handleImportFile}
        aria-hidden
      />
      <Menu
        opened={opened}
        onClose={close}
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
          <Menu.Item leftSection={<IconFileImport size={16} />} onClick={handleImport}>
            Import from DrawIO…
          </Menu.Item>
          <Menu.Item
            leftSection={<IconFileExport size={16} />}
            onClick={handleExport}
            disabled={!diagram}>
            Export to DrawIO
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      {children(handleCanvasContextMenu)}
    </>
  )
}
