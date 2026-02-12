import { usePlayground } from '$/hooks/usePlayground'
import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import { generateDrawio, parseDrawioToLikeC4 } from '@likec4/generators'
import { useCallback, useRef } from 'react'

const DRAWIO_ACCEPT = '.drawio,.drawio.xml,application/x-drawio'

export type DrawioActionsProps = {
  diagram: DiagramView | null
  likec4model: LikeC4Model | null
}

export function useDrawioActions({ diagram, likec4model }: DrawioActionsProps) {
  const playground = usePlayground()
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  }, [diagram, likec4model])

  const triggerImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return {
    fileInputRef,
    handleImportFile,
    handleExport,
    triggerImport,
    canExport: !!diagram,
    DRAWIO_ACCEPT,
  }
}
