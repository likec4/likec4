/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { DiagramView, DiagramApi } from '@likec4/diagrams';
import { Diagram } from '@likec4/diagrams/src/diagram'

const rootDiv = document.createElement('div')
document.body.appendChild(rootDiv)

let root: Root | null = null
const apiRef = createRef<DiagramApi>();

declare global {
  interface Window {
    LikeC4Views: Record<string, DiagramView>
    renderView: (viewId: string) => void
    exportToPngBase64: (pixelRatio?: number) => string
  }
}

window.renderView = (viewId: string) => {
  const diagram = window.LikeC4Views[viewId]
  if (!diagram) {
    throw Error(`Diagram with id ${viewId} not found`)
  }
  if (root) {
    root.unmount()
    root = null
  }
  root = createRoot(rootDiv)
  root.render(
    <Diagram ref={apiRef} interactive={false} animate={false} diagram={diagram} width={diagram.width} height={diagram.height} padding={0}/>
  )
  apiRef.current?.resetStageZoom()
}

window.exportToPngBase64 = (pixelRatio = 2) => {
  if (!apiRef.current) {
    throw Error('No diagram rendered')
  }
  const dataUrl = apiRef.current.toDataURL({pixelRatio})
  return dataUrl.replace(/^data:image\/png;base64,/, '')
}
