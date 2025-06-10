import type { LikeC4Model } from '@likec4/core/model'
import { createContext } from 'react'

export const LikeC4ModelContext = createContext<LikeC4Model<any> | null>(null)
