import {
  compareNatural,
  sortNaturalByFqn,
} from '@likec4/core'
import { type AnyLikeC4Model } from '@likec4/core/model'
import { keys, map, pipe, values } from 'remeda'

function toUnion(elements: string[]) {
  if (elements.length === 0) {
    return 'never'
  }
  let union = elements
    .sort(compareNatural)
    .map(v => `  | ${JSON.stringify(v)}`)
  return union.join('\n').trimStart()
}

function elementIdToUnion(_elements: Record<string, { id: string }>) {
  const elements = values(_elements)
  if (elements.length === 0) {
    return 'never'
  }
  let union = pipe(
    elements,
    sortNaturalByFqn,
    map(v => `  | ${JSON.stringify(v.id)}`),
  )
  return union.join('\n').trimStart()
}

export function generateAux(model: AnyLikeC4Model) {
  return `
import type { Aux, SpecAux } from '@likec4/core/types';

export type $Specs = SpecAux<
  // Element kinds
  ${toUnion(keys(model.specification.elements))},
  // Deployment kinds
  ${toUnion(keys(model.specification.deployments ?? {}))},
  // Relationship kinds
  ${toUnion(keys(model.specification.relationships ?? {}))},
  // Tags
  ${toUnion(keys(model.specification.tags ?? {}))},
  // Metadata keys
  ${toUnion(model.specification.metadataKeys ?? [])}
>

export type $Aux = Aux<
  ${JSON.stringify(model.stage)},
  // Elements
  ${elementIdToUnion(model.$data.elements)},
  // Deployments
  ${elementIdToUnion(model.$data.deployments.elements)},
  // Views
  ${toUnion(keys(model.$data.views))},
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
