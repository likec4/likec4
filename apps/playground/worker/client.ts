import { type aux } from '@likec4/core/types'
import { hc } from 'hono/client'
import type { ApiType } from './index'

// this is a trick to calculate the type when compiling
const client = hc<ApiType>('')
export type Client = typeof client

export const hcWithType = (...args: Parameters<typeof hc>): Client => hc<ApiType>(...args)
