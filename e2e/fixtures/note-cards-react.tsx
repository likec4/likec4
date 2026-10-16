// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

/// <reference types="likec4/vite-plugin-modules" />

import type { BBox } from '@likec4/core/types'
import { LikeC4ModelProvider, ReactLikeC4 } from 'likec4/react'
import { loadModel } from 'likec4:model'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'

const { useLikeC4Model } = await loadModel('notes-live')

function App() {
  const model = useLikeC4Model()
  const [measurement, setMeasurement] = useState<{ bounds: BBox; ready: boolean } | null>(null)
  const [updates, setUpdates] = useState<{ label: string | null | undefined; ready: boolean }[]>([])
  return (
    <LikeC4ModelProvider likec4model={model}>
      <output
        data-updates={JSON.stringify(updates)}
        data-testid="content-bounds"
        data-ready={measurement?.ready ?? false}
        data-width={measurement?.bounds.width}
        data-height={measurement?.bounds.height} />
      <div style={{ width: 800, height: 700 }}>
        <ReactLikeC4
          viewId="update"
          keepAspectRatio
          enableNotes
          onContentBoundsChange={value => {
            setMeasurement(value)
            setUpdates(
              previous => [...previous, { label: model.$data.views.update?.edges[0]?.label, ready: value.ready }],
            )
          }} />
      </div>
    </LikeC4ModelProvider>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('Missing React fixture root')
createRoot(root).render(<App />)
