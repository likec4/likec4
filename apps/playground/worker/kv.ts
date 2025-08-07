import type {
  DeploymentElement,
  DeploymentRelationship,
  DiagramEdge,
  DiagramNode,
  Element,
  ElementSpecification,
  LayoutedLikeC4ModelData,
  LayoutedView,
  NodeNotation,
  Relationship,
  RelationshipSpecification,
  scalar,
  Tag,
  TagSpecification,
} from '@likec4/core/types'
import { addDays, addMonths, getUnixTime, startOfMinute } from 'date-fns'
import { HTTPException } from 'hono/http-exception'
import type { LayoutedLikeC4ModelData as LayoutedLikeC4ModelDataLegacy } from 'likec4-core-legacy/types'
import { nanoid } from 'nanoid'
import * as v from 'valibot'
import { readUserSession } from './auth'
import {
  type GithubLogin,
  type HonoContext,
  type LocalWorkspace,
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
  _stage: v.literal('layouted'),
  projectId: v.optional(v.string()),
  specification: v.object({
    tags: v.optional(RecordAny),
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

type UserShares = {
  shareId: string
  shareOptions: ShareOptions
  localWorkspace: LocalWorkspace
  createdAt: ISODatetime
  expiresAt: ISODatetime
}

type StoredSharedPlayground = {
  forkable: true
  localWorkspace: LocalWorkspace
  title: string
  model: LayoutedLikeC4ModelData<any> | LayoutedLikeC4ModelDataLegacy
  author: GithubLogin | null
  createdAt: ISODatetime
  expiresAt: ISODatetime
} | {
  forkable: false
  title: string
  model: LayoutedLikeC4ModelData<any> | LayoutedLikeC4ModelDataLegacy
  author: GithubLogin | null
  createdAt: ISODatetime
  expiresAt: ISODatetime
}

function isDataLegacy(
  model: LayoutedLikeC4ModelData<any> | LayoutedLikeC4ModelDataLegacy,
): model is LayoutedLikeC4ModelDataLegacy {
  return '__' in model && model.__ === 'layouted'
}

import { compareNatural, nonNullable } from '@likec4/core'
import type * as c4 from '@likec4/core/types'
import { first, map, mapValues, pipe, prop, pullObject, sort, values } from 'remeda'

/**
 * Colors are taken from the styles presets of the LikeC4
 */
export const radixColors = [
  'tomato',
  'grass',
  'blue',
  'ruby',
  'orange',
  'indigo',
  'pink',
  'teal',
  'purple',
  'amber',
  'crimson',
  'red',
  'lime',
  'yellow',
  'violet',
]

function assignTagColors(tags: string[]): Record<Tag, TagSpecification> {
  return pipe(
    tags,
    sort(compareNatural),
    map((tag, idx) => {
      const color = nonNullable(radixColors[idx % radixColors.length] as c4.ColorLiteral)
      return {
        tag,
        spec: {
          color,
        } as c4.TagSpecification,
      }
    }),
    pullObject(prop('tag'), prop('spec')),
  )
}

function convertDescription(description: string | null | undefined) {
  if (description === null) {
    return { description: null }
  }
  if (typeof description === 'string') {
    return { description: { txt: description } }
  }
  return {}
}

function convertLegacyModel(
  { specification, relations, views, elements, deployments, globals, imports }: LayoutedLikeC4ModelDataLegacy,
): LayoutedLikeC4ModelData<any> {
  return {
    _stage: 'layouted',
    projectId: 'default',
    project: { id: 'default' as scalar.ProjectId },
    specification: {
      relationships: specification.relationships as Record<string, Partial<RelationshipSpecification>>,
      elements: specification.elements as Record<string, Partial<ElementSpecification>>,
      deployments: specification.deployments as Record<string, Partial<ElementSpecification>>,
      tags: assignTagColors(specification.tags),
      customColors: first(values(views))?.customColorDefinitions ?? {},
    },
    elements: mapValues(elements, ({ description, ...rest }): Element => ({
      ...rest as unknown as Element,
      ...convertDescription(description),
    })),
    deployments: {
      elements: mapValues(deployments.elements, ({ description, ...rest }): DeploymentElement => ({
        ...rest as unknown as DeploymentElement,
        ...convertDescription(description),
      })),
      relations: mapValues(deployments.relations, ({ description, ...rest }): DeploymentRelationship => ({
        ...rest as unknown as DeploymentRelationship,
        ...convertDescription(description),
      })),
    },
    relations: mapValues(relations, ({ id, source, target, color, description, ...rest }): Relationship => ({
      ...rest,
      ...convertDescription(description),
      id: id as unknown as scalar.RelationId,
      ...(color && { color: color as any }),
      source: {
        model: source,
      },
      target: {
        model: target,
      },
    })),
    views: mapValues(views, ({ __, id, description, nodes, edges, notation, tags, ...rest }): LayoutedView<any> => ({
      ...rest,
      description: description ? { txt: description } : null,
      ...(notation
        ? {
          notation: {
            nodes: notation.elements as NodeNotation[],
          },
        }
        : {}),
      edges: edges.map((
        { tags, description, ...rest },
      ): DiagramEdge<any> => ({
        ...rest as unknown as DiagramEdge<any>,
        ...convertDescription(description),
        tags: tags ? [...tags] : [],
      })),
      nodes: nodes.map(({ id, modelRef, deploymentRef, description, tags, ...rest }): DiagramNode<any> => ({
        ...rest as unknown as DiagramNode<any>,
        id: id as unknown as scalar.NodeId,
        description: description ? { txt: description } : null,
        x: rest.position[0],
        y: rest.position[1],
        tags: tags ? [...tags] : [],
        ...(modelRef && { modelRef: (modelRef === 1 ? id : modelRef) as unknown as scalar.Fqn }),
        ...(deploymentRef &&
          { deploymentRef: (deploymentRef === 1 ? id : deploymentRef) as unknown as scalar.DeploymentFqn }),
      })),
      tags: tags ? [...tags] : [],
      id: id as unknown as scalar.ViewId<string>,
      _type: (__ ?? 'element' as const) as any,
      _stage: 'layouted',
    })),
    imports: imports as any,
    globals: globals as any,
  }
}

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
      console.info(`share ${shareId} access is not pincode, skipping`, { shareOptions })
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
  async function find(shareId: string): Promise<{ value: SharedPlayground; metadata: Metadata }> {
    const data = await c.env.KV.getWithMetadata<StoredSharedPlayground, Metadata>(`share:${shareId}`, 'json')
    const { value, metadata } = data ?? {}
    if (!value || !metadata) {
      return throwShareNotFound(c, shareId)
    }
    const { model } = value
    if (isDataLegacy(model)) {
      return {
        value: {
          ...value,
          model: convertLegacyModel(model),
        },
        metadata,
      }
    } else {
      return {
        value: {
          ...value,
          model,
        },
        metadata,
      }
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

    console.info(`create new share ${shareId} with expiresAt=${expiresAt}`, {
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
        const userShare: UserShares = {
          shareId,
          shareOptions,
          localWorkspace,
          createdAt,
          expiresAt,
        }
        await c.env.KV.put(`${sharesOfUser}::${shareId}`, JSON.stringify(userShare), {
          expiration: getUnixTime(expiresAtDate) + 1,
        })
      } catch (error) {
        console.error(`Failed to save user share`, { userSession, error })
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

  async function myshares(): Promise<UserShares[]> {
    const userSession = readUserSession(c)
    if (!userSession) {
      throw new HTTPException(401, {
        message: 'Unauthorized',
      })
    }
    const prefix = `u:github:${userSession.userId}::`
    let cursor = await c.env.KV.list({
      prefix,
    })
    const shares = [] as UserShares[]
    while (cursor.keys.length > 0) {
      for (const key of cursor.keys) {
        try {
          const data = await c.env.KV.get<UserShares>(key.name, 'json')
          if (data) {
            shares.push(data)
          }
        } catch (error) {
          console.error(`Failed to retrieve share data`, { key, error })
        }
      }
      if (!cursor.list_complete) {
        try {
          cursor = await c.env.KV.list({
            cursor: cursor.cursor,
          })
        } catch (error) {
          console.error(`Failed to list next shares from cursor`, { error })
          break
        }
      } else {
        break
      }
    }
    return shares
  }

  return {
    ensureAccess,
    create,
    find,
    readMetadata,
    myshares,
  }
}

function throwShareNotFound(c: HonoContext, shareId: string): never {
  if (c.req.path.startsWith('/api/')) {
    console.warn(`throwing 404, share ${shareId} not found`)
    throw new HTTPException(404, {
      message: `Share ${shareId} not found or expired`,
    })
  }

  console.warn(`throwing 307, share ${shareId} not found or expired`)
  throw new HTTPException(307, {
    message: 'Redirecting due to not found',
    res: c.redirect(`/share/${shareId}/not-found`),
  })
}

function throwShareInvalidPincode(c: HonoContext, shareId: string): never {
  if (c.req.path.startsWith('/api/')) {
    console.warn(`throwing 401, share ${shareId} invalid pincode`)
    throw new HTTPException(401, {
      message: 'Unauthorized access, requires pincode',
    })
  }

  console.warn(`throwing 307, share ${shareId} requires pincode`)
  throw new HTTPException(307, {
    message: 'Redirecting due to unauthorized access, requires pincode',
    res: c.redirect(`/share/${shareId}/enter-pincode`),
  })
}
