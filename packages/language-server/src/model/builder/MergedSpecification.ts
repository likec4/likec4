import type * as c4 from '@likec4/core'
import { MultiMap } from '@likec4/core'
import {
  FqnRef,
} from '@likec4/core/types'
import {
  isBoolean,
  isEmpty,
  isNonNullish,
  isNumber,
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
import { assignTagColors } from './assignTagColors'

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

  constructor(docs: ParsedLikeC4LangiumDocument[]) {
    const tags = {} as ParsedAstSpecification['tags']
    for (const doc of docs) {
      const {
        c4Specification: spec,
        c4Globals,
        c4Imports,
      } = doc

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
  }

  /**
   * Converts a parsed model into a C4 model element.
   */
  toModelElement = ({
    tags,
    links,
    style: {
      color,
      shape,
      icon,
      opacity,
      border,
      size,
      multiple,
      padding,
      textSize,
    },
    id,
    kind,
    title,
    description,
    technology,
    metadata,
  }: ParsedAstElement): c4.Element | null => {
    try {
      const __kind = this.specs.elements[kind]
      if (!__kind) {
        logger.warn`No kind '${kind}' found for ${id}`
        return null
      }
      color ??= __kind.style.color
      shape ??= __kind.style.shape
      icon ??= __kind.style.icon
      opacity ??= __kind.style.opacity
      border ??= __kind.style.border
      technology ??= __kind.technology
      multiple ??= __kind.style.multiple
      size ??= __kind.style.size
      padding ??= __kind.style.padding
      textSize ??= __kind.style.textSize
      return {
        ...(color && { color }),
        ...(shape && { shape }),
        ...(icon && { icon }),
        ...(metadata && !isEmpty(metadata) && { metadata }),
        ...(__kind.notation && { notation: __kind.notation }),
        style: {
          ...(border && { border }),
          ...(size && { size }),
          ...(padding && { padding }),
          ...(textSize && { textSize }),
          ...(isBoolean(multiple) && { multiple }),
          ...(isNumber(opacity) && { opacity }),
        },
        links: links ?? null,
        tags: tags ?? [],
        technology: technology ?? null,
        description: description ?? null,
        title,
        kind,
        id,
      }
    } catch (e) {
      logWarnError(e)
    }
    return null
  }

  /**
   * Converts a parsed model into a C4 model relation.
   */
  toModelRelation = ({
    astPath,
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
      return null
    }
    try {
      const __kind = this.specs.deployments[parsed.kind as c4.DeploymentKind]
      if (!__kind) {
        logger.warn`No kind ${parsed.kind} found for ${parsed.id}`
        return null
      }
      let {
        technology = __kind.technology,
        notation = __kind.notation,
        style,
      } = parsed
      return {
        ...parsed,
        ...(notation && { notation }),
        ...(technology && { technology }),
        style: {
          border: 'dashed',
          opacity: 10,
          ...__kind.style,
          ...style,
        },
      }
    } catch (e) {
      logWarnError(e)
    }
    return null
  }

  /**
   * Converts a parsed deployment relation into a C4 deployment relation.
   */
  toDeploymentRelation = ({
    astPath,
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
