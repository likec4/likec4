import {
  compareNatural,
  sortNaturalByFqn,
} from '@likec4/core'
import { type AnyLikeC4Model } from '@likec4/core/model'
import { keys, map, pipe } from 'remeda'

function toUnion(elements: string[]) {
  if (elements.length === 0) {
    return 'never;'
  }
  let union = elements
    .sort(compareNatural)
    .map(v => `  | '${v}'`)
  return '\n' + union.join('\n') + ';'
}

function elementIdToUnion(elements: Record<string, { id: string }>) {
  const values = Object.values(elements)
  if (values.length === 0) {
    return 'never;'
  }
  let union = pipe(
    values,
    sortNaturalByFqn,
    map(v => `  | '${v.id}'`),
  )
  return '\n' + union.join('\n') + ';'
}

export function generateAux(model: AnyLikeC4Model) {
  const lines = [
    `export type ElementId = ${elementIdToUnion(model.$data.elements)}`,
    `export type DeploymentId = ${elementIdToUnion(model.$data.deployments.elements)}`,
    `export type ViewId = ${toUnion(keys(model.$data.views))}`,
    `export type ElementKind = ${toUnion(keys(model.$data.specification.elements))}`,
    `export type RelationshipKind = ${toUnion(keys(model.$data.specification.relationships ?? {}))}`,
    `export type DeploymentKind = ${toUnion(keys(model.$data.specification.deployments ?? {}))}`,
    `export type Tag = ${toUnion(keys(model.$data.specification.tags ?? {}))}`,
    `export type MetadataKey = ${toUnion(model.$data.specification.metadataKeys ?? [])}`,
  ]

  return `
import type { Aux, SpecAux } from '@likec4/core/types';

${lines.join('\n\n')}

export type $Aux = Aux<
  '${model.stage}',
  ElementId,
  DeploymentId,
  ViewId,
  '${model.projectId}',
  SpecAux<
    ElementKind,
    DeploymentKind,
    RelationshipKind,
    Tag,
    MetadataKey
  >
>
`.trimStart()
}
