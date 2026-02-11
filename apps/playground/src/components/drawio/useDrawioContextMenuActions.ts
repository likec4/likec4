import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import { generateDrawio, parseDrawioToLikeC4 } from '@likec4/generators'
import { useDisclosure } from '@mantine/hooks'
import { useCallback, useRef, useState } from 'react'

const DRAWIO_ACCEPT = '.drawio,.drawio.xml,application/x-drawio'

export type UseDrawioContextMenuActionsParams = {
  diagram: DiagramView | null
  likec4model: LikeC4Model | null
  onAddFile: (filename: string, content: string) => void
}

export function useDrawioContextMenuActions({
  diagram,
  likec4model,
  onAddFile,
}: UseDrawioContextMenuActionsParams) {
  const [opened, { open, close }] = useDisclosure(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openMenu = useCallback((event: React.MouseEvent) => {
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
          onAddFile(filename, likec4Source)
        } catch (err) {
          console.error('DrawIO import failed', err)
        }
      }
      reader.readAsText(file, 'utf-8')
    },
    [onAddFile],
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

  return {
    openMenu,
    handleImport,
    handleExport,
    handleImportFile,
    fileInputRef,
    menuPosition,
    opened,
    close,
    canExport: diagram != null,
  }
}

export { DRAWIO_ACCEPT }
