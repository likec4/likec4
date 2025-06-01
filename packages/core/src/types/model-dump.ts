import type { KeysOf } from './_common'
import type { Aux, SpecAux } from './aux'
import type * as aux from './aux'
import type { ParsedLikeC4ModelData } from './model-data'

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
export type SpecTypesFromDump<J> = J extends SpecificationDump ? SpecAux<
    KeysOf<J['elements']>,
    KeysOf<J['deployments']>,
    KeysOf<J['relationships']>,
    KeysOf<J['tags']>,
    J['metadataKeys'] extends readonly string[] ? J['metadataKeys'][number] : never
  >
  : SpecAux<never, never, never, never, never>

/**
 * Dump differs from {@link ParsedLikeC4ModelData} by the fact that it is computed or layouted
 */
export type LikeC4ModelDump = {
  __: 'computed' | 'layouted'
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
  : Aux<never, never, never, never, SpecAux<never, never, never, never, never>>
