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
    `export type ElementId = ${elementIdToUnion(model.$model.elements)}`,
    `export type DeploymentId = ${elementIdToUnion(model.$model.deployments.elements)}`,
    `export type ViewId = ${toUnion(keys(model.$model.views))}`,
    `export type ElementKind = ${toUnion(keys(model.$model.specification.elements))}`,
    `export type RelationshipKind = ${toUnion(keys(model.$model.specification.relationships ?? {}))}`,
    `export type DeploymentKind = ${toUnion(keys(model.$model.specification.deployments ?? {}))}`,
    `export type Tag = ${toUnion(keys(model.$model.specification.tags ?? {}))}`,
    `export type MetadataKey = ${toUnion(model.$model.specification.metadataKeys ?? [])}`,
  ]

  return `
import type { Aux, SpecAux } from '@likec4/core/types';

${lines.join('\n\n')}

export type $Aux = Aux<
  '${model.projectId}',
  ElementId,
  DeploymentId,
  ViewId,
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
