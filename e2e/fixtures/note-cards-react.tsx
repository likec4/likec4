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
  return (
    <LikeC4ModelProvider likec4model={model}>
      <output
        data-testid="content-bounds"
        data-ready={measurement?.ready ?? false}
        data-width={measurement?.bounds.width}
        data-height={measurement?.bounds.height} />
      <div style={{ width: 800, height: 700 }}>
        <ReactLikeC4
          viewId="update"
          keepAspectRatio
          enableNotes
          onContentBoundsChange={setMeasurement} />
      </div>
    </LikeC4ModelProvider>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('Missing React fixture root')
createRoot(root).render(<App />)
