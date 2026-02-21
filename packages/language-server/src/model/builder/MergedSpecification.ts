import type * as c4 from '@likec4/core'
import { assignTagColors } from '@likec4/core/styles'
import { exact, FqnRef } from '@likec4/core/types'
import { isNonEmptyArray, MultiMap, nameFromFqn } from '@likec4/core/utils'
import {
  isEmpty,
  isEmptyish,
  isNonNullish,
  only,
  unique,
} from 'remeda'
import type {
  ParsedAstDeployment,
  ParsedAstDeploymentRelation,
  ParsedAstElement,
  ParsedAstRelation,
  ParsedAstSpecification,
  ParsedLikeC4LangiumDocument,
} from '../../ast'
import { logger, logWarnError } from '../../logger'

const iconTechPrefixRe = /^(aws|azure|gcp|tech):(.+)$/

/**
 * Derives a human-readable technology string from a built-in icon name.
 * Applies to aws:, azure:, gcp:, and tech: prefixed icons.
 * Strips `-icon` suffix and converts kebab-case to title case.
 *
 * @example
 * deriveTechnologyFromIcon('tech:apache-flink') // "Apache Flink"
 * deriveTechnologyFromIcon('tech:codeclimate-icon') // "Codeclimate"
 * deriveTechnologyFromIcon('aws:simple-storage-service') // "Simple Storage Service"
 * deriveTechnologyFromIcon('bootstrap:house') // undefined
 */
export function deriveTechnologyFromIcon(icon: string | undefined): string | undefined {
  if (!icon) return undefined
  const match = iconTechPrefixRe.exec(icon)
  if (!match) return undefined
  const name = match[2]!.replace(/-icon$/, '')
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * The `MergedSpecification` class is responsible for merging multiple parsed
 * LikeC4Langium documents into a single specification. It consolidates tags,
 * elements, deployments, relationships, and colors from the provided documents
 * and provides methods to convert parsed models into C4 model elements and relations.
 */
export class MergedSpecification {
  public readonly specs: Omit<ParsedAstSpecification, 'tags'> = {
    elements: {},
    deployments: {},
    relationships: {},
    colors: {},
  }

  public readonly tags: Readonly<Record<c4.Tag, c4.TagSpecification>>

  public readonly globals: c4.ModelGlobals = {
    predicates: {},
    dynamicPredicates: {},
    styles: {},
  }

  public readonly imports: MultiMap<c4.ProjectId, c4.Fqn, Set<c4.Fqn>> = new MultiMap(Set)

  // If all documents belong to the same project, we can assign this.projectId to that project ID.
  // Otherwise, it will be undefined.
  public readonly projectId: c4.ProjectId | undefined

  public readonly inferTechFromIcon: boolean

  constructor(docs: ReadonlyArray<ParsedLikeC4LangiumDocument>, opts?: { inferTechFromIcon?: boolean }) {
    const tags = {} as ParsedAstSpecification['tags']
    let projectIds = [] as c4.ProjectId[]
    for (const doc of docs) {
      const {
        c4Specification: spec,
        c4Globals,
        c4Imports,
      } = doc

      let docProjectId = doc.likec4ProjectId
      if (isNonNullish(docProjectId)) {
        if (projectIds.length === 0 || projectIds[0] !== docProjectId) {
          projectIds.push(doc.likec4ProjectId!)
        }
      }

      Object.assign(tags, spec.tags)
      Object.assign(this.specs.elements, spec.elements)
      Object.assign(this.specs.relationships, spec.relationships)
      Object.assign(this.specs.colors, spec.colors)
      Object.assign(this.specs.deployments, spec.deployments)
      Object.assign(this.globals.predicates, c4Globals.predicates)
      Object.assign(this.globals.dynamicPredicates, c4Globals.dynamicPredicates)
      Object.assign(this.globals.styles, c4Globals.styles)

      for (const [projectId, fqn] of c4Imports) {
        this.imports.set(projectId, fqn)
      }
    }
    this.tags = assignTagColors(tags)

    this.projectId = only(projectIds)
    this.inferTechFromIcon = opts?.inferTechFromIcon ?? true
  }

  /**
   * Converts a parsed model into a C4 model element.
   */
  toModelElement = ({
    tags,
    links,
    style,
    id,
    kind,
    title,
    description,
    technology,
    summary,
    metadata,
  }: ParsedAstElement): c4.Element | null => {
    try {
      const __kind = this.specs.elements[kind]
      if (!__kind) {
        logger.warn`No kind '${kind}' found for ${id}`
        return null
      }
      technology ??= __kind.technology
      description ??= __kind.description
      summary ??= __kind.summary
      links ??= __kind.links

      if (isEmptyish(title)) {
        title = __kind.title || nameFromFqn(id)
      }

      if (__kind.tags && isNonEmptyArray(__kind.tags)) {
        tags = tags
          ? unique([
            ...__kind.tags,
            ...tags,
          ])
          : __kind.tags
      }

      const mergedStyle = exact({
        ...__kind.style,
        ...style,
      }) satisfies c4.ElementStyle

      if (!technology && this.inferTechFromIcon) {
        technology = deriveTechnologyFromIcon(mergedStyle.icon)
      }

      return exact({
        metadata: metadata && !isEmpty(metadata) ? metadata : undefined,
        notation: __kind.notation,
        style: mergedStyle,
        links,
        tags,
        summary,
        technology,
        description,
        title,
        kind,
        id,
      })
    } catch (e) {
      logWarnError(e)
    }
    return null
  }

  /**
   * Converts a parsed model into a C4 model relation.
   */
  toModelRelation = ({
    astPath: _astPath, // omit
    source,
    target,
    kind,
    links,
    id,
    ...model
  }: ParsedAstRelation): c4.Relationship | null => {
    if (isNonNullish(kind) && this.specs.relationships[kind]) {
      return {
        ...this.specs.relationships[kind],
        ...model,
        ...(links && { links }),
        source,
        target,
        kind,
        id,
      } satisfies c4.Relationship
    }
    return {
      ...(links && { links }),
      ...model,
      source,
      target,
      id,
    } satisfies c4.Relationship
  }

  /**
   * Converts a parsed deployment model into a C4 deployment model
   */
  toDeploymentElement = (parsed: ParsedAstDeployment): c4.DeploymentElement | null => {
    if ('element' in parsed && !('kind' in parsed)) {
      return {
        ...parsed,
        element: FqnRef.flatten(parsed.element),
      }
    }
    if ('element' in parsed) {
      logger.warn`Invalid ParsedAstDeployment ${parsed.id}, has both element and kind properties`
      return null
    }
    try {
      const __kind = this.specs.deployments[parsed.kind as c4.DeploymentKind]
      if (!__kind) {
        logger.warn`No kind ${parsed.kind} found for ${parsed.id}`
        return null
      }
      let {
        id,
        style,
        title,
        ...rest
      } = parsed
      title = title === nameFromFqn(parsed.id) && __kind.title ? __kind.title : title
      return exact({
        ...__kind,
        ...rest,
        title,
        style: exact({
          ...__kind.style,
          ...style,
        }) satisfies c4.ElementStyle,
        id,
      })
    } catch (e) {
      logWarnError(e)
    }
    return null
  }

  /**
   * Converts a parsed deployment relation into a C4 deployment relation.
   */
  toDeploymentRelation = ({
    astPath: _astPath, // omit
    source,
    target,
    kind,
    links,
    id,
    ...model
  }: ParsedAstDeploymentRelation): c4.DeploymentRelationship | null => {
    if (isNonNullish(kind) && this.specs.relationships[kind as c4.RelationshipKind]) {
      return {
        ...this.specs.relationships[kind as c4.RelationshipKind],
        ...model,
        ...(links && { links }),
        source,
        target,
        kind,
        id,
      } satisfies c4.DeploymentRelationship
    }
    return {
      ...(links && { links }),
      ...model,
      source,
      target,
      id,
    } satisfies c4.DeploymentRelationship
  }
}
