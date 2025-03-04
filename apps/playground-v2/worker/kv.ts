import { addDays, addMonths, getUnixTime, isFuture, parseISO, startOfMinute } from 'date-fns'
import { HTTPException } from 'hono/http-exception'
import { nanoid } from 'nanoid'
import * as v from 'valibot'
import { readUserSession } from './auth'
import {
  type HonoContext,
  type SharedPlayground,
  type ShareOptions,
  type UserSession,
  ISODatetime,
  LocalWorkspaceSchema,
  ShareOptionsSchema,
} from './types'

type Metadata = {
  shareOptions: ShareOptions
  userSession: UserSession | null
}

type ModelSchema = v.InferOutput<typeof ModelSchema>
const RecordAny = v.record(v.string(), v.any())
const ModelSchema = v.object({
  __: v.literal('layouted'),
  specification: v.object({
    tags: v.array(v.string()),
    elements: RecordAny,
    deployments: RecordAny,
    relationships: RecordAny,
  }),
  elements: RecordAny,
  relations: RecordAny,
  globals: RecordAny,
  views: RecordAny,
  deployments: v.object({
    elements: RecordAny,
    relations: RecordAny,
  }),
})

export type SharePlaygroundReqSchema = v.InferOutput<typeof SharePlaygroundReqSchema>
export const SharePlaygroundReqSchema = v.object({
  localWorkspace: LocalWorkspaceSchema,
  model: ModelSchema,
  shareOptions: ShareOptionsSchema,
})

export const sharesKV = (c: HonoContext) => {
  /**
   * Check if a share exists in KV, but don't read the value.
   * This is used to check if a share is valid before reading it.
   * @param shareId The ID of the share to check.
   */
  async function readMetadata(shareId: string) {
    const data = await c.env.KV.getWithMetadata<Metadata>(`share:${shareId}`, 'stream')
    if (!data.value) {
      return throwShareNotFound(c, shareId)
    }
    await data.value.cancel()
    if (!data.metadata) {
      return throwShareNotFound(c, shareId)
    }
    return data.metadata
  }

  async function ensureAccess(shareId: string, shareOptions?: ShareOptions) {
    if (!shareOptions) {
      const metadata = await readMetadata(shareId)
      shareOptions = metadata.shareOptions
    }

    if (shareOptions.access != 'pincode') {
      return
    }

    const lastPincode = c.get('session').get('pincode')
    if (lastPincode !== shareOptions.pincode) {
      console.warn(
        `invalid pincode: share ${shareId} has pincode=${shareOptions.pincode} and session lastPincode=${lastPincode}`,
      )
      return throwShareInvalidPincode(c, shareId)
    }
  }

  /**
   * Find a share in KV.
   * @param shareId The ID of the share to find.
   */
  async function find(shareId: string) {
    const data = await c.env.KV.getWithMetadata<SharedPlayground, Metadata>(`share:${shareId}`, 'json')
    if (!data.value || !data.metadata) {
      return throwShareNotFound(c, shareId)
    }
    return {
      value: data.value!,
      metadata: data.metadata!,
    }
  }

  /**
   * Create a new share in KV
   */
  async function create({
    localWorkspace,
    model,
    shareOptions,
  }: SharePlaygroundReqSchema) {
    const userSession = readUserSession(c)
    const shareId = nanoid(10)

    let expiresAtDate
    const now = startOfMinute(new Date())
    switch (shareOptions.expires) {
      case 'D1':
        expiresAtDate = addDays(now, 1)
        break
      case 'D7':
        expiresAtDate = addDays(now, 7)
        break
      case 'M1':
        expiresAtDate = addMonths(now, 1)
        break
      case 'M3':
        expiresAtDate = addMonths(now, 3)
        break
    }
    const createdAt = ISODatetime(now)
    const expiresAt = ISODatetime(expiresAtDate)
    const persistedModel = {
      title: localWorkspace.title,
      author: userSession?.login ?? null,
      createdAt,
      expiresAt,
      forkable: false,
      model: model as any,
    } satisfies SharedPlayground
    if (shareOptions.forkable) {
      Object.assign(persistedModel, {
        forkable: true,
        localWorkspace,
      })
    }

    console.info(`create new share ${shareId}`, {
      shareId,
      shareOptions,
    })

    await c.env.KV.put('share:' + shareId, JSON.stringify(persistedModel), {
      expiration: getUnixTime(expiresAtDate),
      metadata: {
        shareOptions,
        userSession,
      },
    })

    if (userSession) {
      try {
        const sharesOfUser = `u:github:${userSession.userId}`
        await c.env.KV.put(`${sharesOfUser}::${shareId}`, shareId, {
          expiration: getUnixTime(expiresAtDate) + 1,
        })
      } catch (error) {
        console.error(`Failed to save user shares`, { userSession, error })
      }
    }
    return {
      shareId,
      createdAt,
      expiresAt,
      shareOptions,
      userId: userSession?.userId ?? null,
    }
  }

  return {
    ensureAccess,
    create,
    find,
    readMetadata,
  }
}

function throwShareNotFound(c: HonoContext, shareId: string): never {
  console.warn(`Throwing share ${shareId} not found`)
  if (c.req.path.startsWith('/api/')) {
    throw new HTTPException(404, {
      message: `Share ${shareId} not found or expired`,
    })
  }

  throw new HTTPException(307, {
    message: 'Redirecting due to unauthorized access, requires pincode',
    res: c.redirect(`/share/${shareId}/not-found`),
  })
}

function throwShareInvalidPincode(c: HonoContext, shareId: string): never {
  console.warn(`Throwing share ${shareId} invalid pincode`)
  if (c.req.path.startsWith('/api/')) {
    throw new HTTPException(401, {
      message: 'Unauthorized access, requires pincode',
    })
  }

  throw new HTTPException(307, {
    message: 'Redirecting due to unauthorized access, requires pincode',
    res: c.redirect(`/share/${shareId}/enter-pincode`),
  })
}
