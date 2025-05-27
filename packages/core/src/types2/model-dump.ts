import type { KeysOf } from './_common'
import type { Aux, Specification, SpecTypes, UnknownAux } from './aux'

/**
 * JSON representation of {@link Specification}
 */
export interface SpecificationDump {
  elements: {
    [kind: string]: object
  }
  tags?: {
    [tag: string]: object
  }
  deployments?: {
    [kind: string]: object
  }
  relationships?: {
    [kind: string]: object
  }
  metadataKeys?: string[]
}
export type SpecTypesFromDump<J> = J extends SpecificationDump ? SpecTypes<
    KeysOf<J['elements']>,
    KeysOf<J['deployments']>,
    KeysOf<J['relationships']>,
    KeysOf<J['tags']>,
    J['metadataKeys'] extends readonly string[] ? J['metadataKeys'][number] : never
  >
  : SpecTypes<never, never, never, never, never>

/**
 * Hook to get types from dump
 */
export type LikeC4ModelDump = {
  projectId?: string
  specification: SpecificationDump
  elements: {
    [kind: string]: object
  }
  deployments: {
    elements?: {
      [kind: string]: object
    }
  }
  views: {
    [kind: string]: object
  }
}

export type AuxFromDump<D> = D extends LikeC4ModelDump ? Aux<
    D['projectId'] extends string ? D['projectId'] : never,
    KeysOf<D['elements']>,
    KeysOf<D['deployments']['elements']>,
    KeysOf<D['views']>,
    SpecTypesFromDump<D['specification']>
  >
  : UnknownAux
