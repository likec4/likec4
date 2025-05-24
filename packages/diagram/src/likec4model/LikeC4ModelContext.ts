import type { AnyAux, LikeC4Model } from '@likec4/core/model'
import { createContext } from 'react'

export const LikeC4ModelContext = createContext<LikeC4Model<AnyAux> | null>(null)
