
import type { ComponentType } from 'react'
import type { LikeC4ViewProps } from './generated'
import dynamic from 'next/dynamic'

export const LikeC4View: ComponentType<LikeC4ViewProps> = dynamic(
  () => import('./generated').then(m => m.LikeC4View),
  {
    loading: () => <div>loading...</div>,
    ssr: false,
  }
)
