import { hc } from 'hono/client'
import type { ApiType } from './index'

// this is a trick to calculate the type when compiling
const client = hc<ApiType>('')
export type Client = typeof client

type one = Client['api']['share'][':shareId']['$get']
client.api.share[':shareId'].$get({ param: { shareId: '123' } })

export const hcWithType = (...args: Parameters<typeof hc>): Client => hc<ApiType>(...args)
