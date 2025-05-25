import type { ApiType } from '#worker'
import type { SharedPlayground } from '#worker/types'
import { notFound } from '@tanstack/react-router'
import { type ClientResponse, type InferRequestType, type InferResponseType, hc } from 'hono/client'
import type { Get } from 'type-fest'

const workerApi = hc<ApiType>('')

type WorkerApi = typeof workerApi

export function json<T, A extends any[]>(
  req: (...a: A) => Promise<ClientResponse<T, any, 'json'>>,
): (...a: A) => Promise<T> {
  return async (..._args: A) => {
    const response = await req(..._args)
    if (response.status === 404) {
      throw notFound()
    }
    if (!response.ok) {
      throw new Error(`Request ${response.url} failed with status ${response.status}`)
    }
    return await response.json()
  }
}

export namespace Api {
  export namespace Share {
    export type Payload = InferRequestType<Get<WorkerApi, 'api.share.$post'>>['json']
    export type Response = InferResponseType<Get<WorkerApi, 'api.share.$post'>>
  }
}

export const api = {
  auth: {
    me: json(workerApi.auth.me.$get),
  },
  share: {
    my: json(workerApi.api.share.my.$get),
    create: json(workerApi.api.share.$post),
    checkPin: async (shareId: string, pincode: string) => {
      const response = await workerApi.api.share[':shareId']['check-pincode'].$post({
        param: { shareId },
        json: { pincode },
      })
      if (!response.ok) {
        const error = await response.text()
        return {
          valid: false as const,
          error: error || response.statusText,
        }
      }
      return await response.json()
    },
    // Force type cast to make TypeScript happy
    get: json<SharedPlayground, [{ param: { shareId: string } }]>(workerApi.api.share[':shareId'].$get as any),
  },
}
