/// <reference path="../worker-configuration.d.ts" />
import type { LayoutedLikeC4ModelData } from '@likec4/core/types'
import { formatISO } from 'date-fns'
import type { Context } from 'hono'
import type { Session } from 'hono-sessions'
import { createFactory } from 'hono/factory'
import type { Tagged } from 'type-fest'
import * as z from 'zod/v4'

export const factory = createFactory<HonoEnv>()

export type GithubLogin = Tagged<string, 'GithubLogin'>
export type UserSession = {
  login: GithubLogin
  userId: number
  name: string
  email: string | null
  avatarUrl: string | null
}

export type SessionData = UserSession & {
  /**
   * Last entered password
   */
  pincode: string
}

export type HonoEnv = {
  Variables: {
    session: Session<SessionData>
    session_key_rotation: boolean
  }
  Bindings: Env
}

export type HonoContext = Context<HonoEnv>

const nonEmptyString = z.string().nonempty('The string should contain at least one character.')

export type LocalWorkspace = z.infer<typeof LocalWorkspaceSchema>
export const LocalWorkspaceSchema = z.object({
  workspaceId: nonEmptyString,
  title: z.string(),
  activeFilename: nonEmptyString,
  files: z.record(nonEmptyString, z.string()),
})

export type ExpiresValue = z.infer<typeof ExpiresValueSchema>
export const ExpiresValueSchema = z.literal([
  'D1',
  'D7',
  'M1',
  'M3',
])

// export type AccessValue = v.InferOutput<typeof AccessValueSchema>
// export const AccessValueSchema = v.union([
//   v.literal('any'),
//   v.literal('password'),
//   v.literal('github:org'),
// ])

export type ShareOptions = z.infer<typeof ShareOptionsSchema>
export const ShareOptionsSchema = z.discriminatedUnion('access', [
  z.object({
    access: z.literal('pincode'),
    expires: ExpiresValueSchema,
    forkable: z.boolean(),
    pincode: z.string()
      .min(4, 'The pincode should be at least 4 characters long.')
      .max(4, 'The pincode should be at most 4 characters long.'),
  }),
  z.object({
    access: z.literal([
      'any',
      'github:org',
      'github:team',
    ]),
    expires: ExpiresValueSchema,
    forkable: z.boolean(),
  }),
])
export type AccessValue = ShareOptions['access']

// export const ShareOptionsSchema = v.object({

//   ...AccessValueSchema.e
// })
export type SharedPlayground = {
  forkable: true
  localWorkspace: LocalWorkspace
  title: string
  model: LayoutedLikeC4ModelData<any>
  author: GithubLogin | null
  createdAt: ISODatetime
  expiresAt: ISODatetime
} | {
  forkable: false
  title: string
  model: LayoutedLikeC4ModelData<any>
  author: GithubLogin | null
  createdAt: ISODatetime
  expiresAt: ISODatetime
}

// declare const __tag: unique symbol
export type ISODatetime = Tagged<string, 'ISODatetime'>
export function ISODatetime(value: Date | number | string): ISODatetime {
  if (typeof value === 'string') {
    return value as ISODatetime
  }
  return formatISO(value, { format: 'extended', representation: 'complete' }) as ISODatetime
}
