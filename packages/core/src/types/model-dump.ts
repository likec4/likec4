import type * as aux from './_aux'
import type { KeysOf } from './_common'
import type { _stage } from './const'
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
  customColors?: {
    [kind: string]: object
  }
}
export type SpecTypesFromDump<J> = J extends SpecificationDump ? aux.SpecAux<
    KeysOf<J['elements']>,
    KeysOf<J['deployments']>,
    KeysOf<J['relationships']>,
    KeysOf<J['tags']>,
    J['metadataKeys'] extends readonly [string, ...string[]] ? J['metadataKeys'][number] : never
  >
  : aux.SpecAux<never, never, never, never, never>

/**
 * Dump differs from {@link ParsedLikeC4ModelData} by the fact that it is computed or layouted
 */
export type LikeC4ModelDump = {
  [_stage]?: 'computed' | 'layouted'
  projectId?: string
  project: ProjectDump
  specification: SpecificationDump
  elements?: {
    [kind: string]: object
  }
  deployments: {
    elements?: {
      [kind: string]: object
    }
    relations?: {}
  }
  views?: {
    [kind: string]: object
  }
  relations?: {}
  globals?: {
    predicates?: {}
    dynamicPredicates?: {}
    styles?: {}
  }
  imports?: {}
}

export type ProjectDump = {
  id: string
  name?: string
  title?: string | undefined
}

export type AuxFromDump<D> = D extends LikeC4ModelDump ? aux.Aux<
    D[_stage] extends infer S extends string & 'computed' | 'layouted' ? S : 'computed' | 'layouted' | 'parsed',
    KeysOf<D['elements']>,
    KeysOf<D['deployments']['elements']>,
    KeysOf<D['views']>,
    D['projectId'] extends infer PID extends string ? PID : never,
    SpecTypesFromDump<D['specification']>
  >
  : aux.Never
