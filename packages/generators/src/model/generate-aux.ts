import type { AnyLikeC4Model } from '@likec4/core/model'
import {
  compareNatural,
  sortNaturalByFqn,
} from '@likec4/core/utils'
import { filter, isEmptyish, isTruthy, keys, map, pipe, sort, unique, values } from 'remeda'

/**
 * Converts an array of strings or a record keys to a TypeScript union type string
 * Handles empty arrays/records by returning 'never'
 */
function toUnion(elements: string[] | Record<string, unknown> | undefined) {
  if (isEmptyish(elements)) {
    return 'never'
  }
  if (typeof elements === 'object' && !Array.isArray(elements)) {
    elements = keys(elements)
  }
  let union = pipe(
    elements,
    unique(),
    sort(compareNatural),
    map(v => `  | ${JSON.stringify(v)}`),
  )
  return union.join('\n').trimStart()
}

function elementIdToUnion(elements: Record<string, { id: string }>) {
  let union = pipe(
    elements,
    values(),
    filter(i => !!i && isTruthy(i.id)),
    sortNaturalByFqn,
    map(v => `  | ${JSON.stringify(v.id)}`),
  )
  if (union.length === 0) {
    return 'never'
  }
  return union.join('\n').trimStart()
}

export function generateAux(model: AnyLikeC4Model, options: { useCorePackage?: boolean } = {}) {
  const { useCorePackage = false } = options
  return `
import type { Aux, SpecAux } from '${useCorePackage ? '@likec4/core/types' : 'likec4/model'}';

export type $Specs = SpecAux<
  // Element kinds
  ${toUnion(model.specification.elements)},
  // Deployment kinds
  ${toUnion(model.specification.deployments)},
  // Relationship kinds
  ${toUnion(model.specification.relationships)},
  // Tags
  ${toUnion(model.specification.tags)},
  // Metadata keys
  ${toUnion(model.specification.metadataKeys)}
>

export type $Aux = Aux<
  ${JSON.stringify(model.stage)},
  // Elements
  ${elementIdToUnion(model.$data.elements)},
  // Deployments
  ${elementIdToUnion(model.$data.deployments.elements)},
  // Views
  ${toUnion(model.$data.views)},
  // Project ID
  ${JSON.stringify(model.projectId)},
  $Specs
>

export type $ElementId = $Aux['ElementId']
export type $DeploymentId = $Aux['DeploymentId']
export type $ViewId = $Aux['ViewId']

export type $ElementKind = $Aux['ElementKind']
export type $RelationKind = $Aux['RelationKind']
export type $DeploymentKind = $Aux['DeploymentKind']
export type $Tag = $Aux['Tag']
export type $Tags = readonly $Aux['Tag'][]
export type $MetadataKey = $Aux['MetadataKey']
`.trimStart()
}
