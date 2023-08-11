/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { DiagramView, DiagramApi } from '@likec4/diagrams'
import { Diagram } from '@likec4/diagrams'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const rootDiv = document.getElementById('root')!

let root: Root | null = null
const apiRef = createRef<DiagramApi>()

declare global {
  interface Window {
    LikeC4Views: Record<string, DiagramView>
    renderView: (viewId: string) => void
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
    <React.Fragment>
      <Diagram
        ref={apiRef}
        animate={false}
        zoomable={false}
        pannable={false}
        diagram={diagram}
        width={diagram.width}
        height={diagram.height}
        initialPosition={{
          x: 0,
          y: 0,
          scale: 1
        }}
        padding={0}
      />
    </React.Fragment>
  )
}
