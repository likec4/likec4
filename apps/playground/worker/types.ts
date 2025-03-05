import type { LayoutedLikeC4Model } from '@likec4/core'
import { formatISO } from 'date-fns'
import { type Context } from 'hono'
import type { Session } from 'hono-sessions'
import { createFactory } from 'hono/factory'
import type { Tagged } from 'type-fest'
import * as v from 'valibot'

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

const nonEmptyString = v.pipe(
  v.string(),
  v.nonEmpty('The string should contain at least one character.'),
)

export type LocalWorkspace = v.InferOutput<typeof LocalWorkspaceSchema>
export const LocalWorkspaceSchema = v.object({
  workspaceId: nonEmptyString,
  title: v.string(),
  activeFilename: nonEmptyString,
  files: v.record(nonEmptyString, v.string()),
})

export type ExpiresValue = v.InferOutput<typeof ExpiresValueSchema>
export const ExpiresValueSchema = v.union([
  v.literal('D1'),
  v.literal('D7'),
  v.literal('M1'),
  v.literal('M3'),
])

// export type AccessValue = v.InferOutput<typeof AccessValueSchema>
// export const AccessValueSchema = v.union([
//   v.literal('any'),
//   v.literal('password'),
//   v.literal('github:org'),
// ])

export type ShareOptions = v.InferOutput<typeof ShareOptionsSchema>
export const ShareOptionsSchema = v.variant('access', [
  v.object({
    access: v.literal('pincode'),
    expires: ExpiresValueSchema,
    forkable: v.boolean(),
    pincode: v.pipe(
      v.string(),
      v.minLength(4, 'The pincode should be at least 4 characters long.'),
      v.maxLength(4, 'The pincode should be at most 4 characters long.'),
    ),
  }),
  v.object({
    access: v.union([
      v.literal('any'),
      v.literal('github:org'),
      v.literal('github:team'),
    ]),
    expires: ExpiresValueSchema,
    forkable: v.boolean(),
  }),
  // v.literal('any'),
  // v.literal('password'),
  // v.literal('github:org'),
])
export type AccessValue = ShareOptions['access']

// export const ShareOptionsSchema = v.object({

//   ...AccessValueSchema.e
// })
export type SharedPlayground = {
  forkable: true
  localWorkspace: LocalWorkspace
  title: string
  model: LayoutedLikeC4Model
  author: GithubLogin | null
  createdAt: ISODatetime
  expiresAt: ISODatetime
} | {
  forkable: false
  title: string
  model: LayoutedLikeC4Model
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
