import type * as c4 from '@likec4/core'
import { MultiMap } from '@likec4/core'
import {
  elementFromActivityId,
  FqnRef,
} from '@likec4/core/types'
import {
  isBoolean,
  isEmpty,
  isNonNullish,
  isNumber,
} from 'remeda'
import type {
  ParsedAstActivity,
  ParsedAstActivityStep,
  ParsedAstDeployment,
  ParsedAstDeploymentRelation,
  ParsedAstElement,
  ParsedAstRelation,
  ParsedAstSpecification,
  ParsedLikeC4LangiumDocument,
} from '../../ast'
import { logger, logWarnError } from '../../logger'

/**
 * The `MergedSpecification` class is responsible for merging multiple parsed
 * LikeC4Langium documents into a single specification. It consolidates tags,
 * elements, deployments, relationships, and colors from the provided documents
 * and provides methods to convert parsed models into C4 model elements and relations.
 */
export class MergedSpecification {
  public readonly specs: ParsedAstSpecification = {
    tags: new Set(),
    elements: {},
    deployments: {},
    relationships: {},
    colors: {},
  }

  public readonly globals: c4.ModelGlobals = {
    predicates: {},
    dynamicPredicates: {},
    styles: {},
  }

  public readonly imports: MultiMap<c4.ProjectId, c4.Fqn, Set<c4.Fqn>> = new MultiMap(Set)

  constructor(docs: ParsedLikeC4LangiumDocument[]) {
    for (const doc of docs) {
      const {
        c4Specification: spec,
        c4Globals,
        c4Imports,
      } = doc

      spec.tags.forEach(t => this.specs.tags.add(t))
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
        tags: tags ?? null,
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

  toModelActivity = ({
    astPath,
    id,
    steps,
    name,
    ...model
  }: ParsedAstActivity): c4.Activity => {
    const modelRef = elementFromActivityId(id)
    return {
      ...model,
      steps: steps.map(s => this.toModelActivityStep(s)),
      modelRef,
      name,
      id,
    }
  }

  toModelActivityStep = ({
    astPath,
    kind,
    ...model
  }: ParsedAstActivityStep): c4.ActivityStep => {
    if (isNonNullish(kind)) {
      if (this.specs.relationships[kind]) {
        return {
          ...this.specs.relationships[kind],
          kind,
          ...model,
        }
      } else {
        logger.warn`No relationship kind ${kind} found for ${astPath} (activity step)`
      }
    }
    return model
  }

  /**
   * Converts a parsed model into a C4 model relation.
   */
  toModelRelation = ({
    astPath,
    source: sourceFqnRef,
    target: targetFqnRef,
    kind,
    ...model
  }: ParsedAstRelation): c4.ModelRelation => {
    const target = FqnRef.toModelFqn(targetFqnRef)
    const source = FqnRef.toModelFqn(sourceFqnRef)
    if (isNonNullish(kind)) {
      if (this.specs.relationships[kind]) {
        return {
          ...this.specs.relationships[kind],
          ...model,
          source,
          target,
          kind,
        }
      } else {
        logger.warn`No relationship kind ${kind} found for ${astPath} (${source} -> ${target})`
      }
    }
    return {
      ...model,
      source,
      target,
    }
  }

  /**
   * Converts a parsed deployment model into a C4 deployment model
   */
  toDeploymentElement = (parsed: ParsedAstDeployment): c4.DeploymentElement | null => {
    if ('element' in parsed && !('kind' in parsed)) {
      return {
        ...parsed,
        element: FqnRef.toModelFqn(parsed.element),
      }
    }
    if ('element' in parsed) {
      return null
    }
    try {
      const __kind = this.specs.deployments[parsed.kind]
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
  }: ParsedAstDeploymentRelation): c4.DeploymentRelation => {
    if (isNonNullish(kind) && this.specs.relationships[kind]) {
      return {
        ...this.specs.relationships[kind],
        ...model,
        ...(links && { links }),
        source,
        target,
        kind,
        id,
      } satisfies c4.DeploymentRelation
    }
    return {
      ...(links && { links }),
      ...model,
      source,
      target,
      id,
    } satisfies c4.DeploymentRelation
  }
}
