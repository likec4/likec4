import type { LikeC4Model } from '@likec4/core'
import { createContext } from 'react'

export const LikeC4ModelContext = createContext<LikeC4Model | null>(null)
