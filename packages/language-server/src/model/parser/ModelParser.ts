import type * as c4 from '@likec4/core'
import { invariant, isNonEmptyArray, LinkedList, nonexhaustive, nonNullable } from '@likec4/core'
import { FqnRef } from '@likec4/core/types'
import { loggable } from '@likec4/log'
import {
  filter,
  first,
  flatMap,
  fromEntries,
  isDefined,
  isEmpty,
  isNonNullish,
  isTruthy,
  map,
  mapToObj,
  pipe,
} from 'remeda'
import {
  type LikeC4LangiumDocument,
  type ParsedAstActivity,
  type ParsedAstActivityStep,
  type ParsedAstElement,
  type ParsedAstExtend,
  type ParsedAstRelation,
  ast,
  toRelationshipStyleExcludeDefaults,
} from '../../ast'
import { type ElementStringProperty, type RelationStringProperty } from '../../generated/ast'
import { logger as mainLogger } from '../../logger'
import { stringHash } from '../../utils/stringHash'
import { removeIndent, toSingleLine } from './Base'
import type { WithExpressionV2 } from './FqnRefParser'

export type WithModel = ReturnType<typeof ModelParser>

const logger = mainLogger.getChild('ModelParser')

function* streamModel(
  doc: LikeC4LangiumDocument,
): Generator<ast.Element | ast.ExtendElement | ast.Relation | ast.Activity> {
  const traverseStack = LinkedList.from<ast.Element | ast.ExtendElement | ast.Relation | ast.Activity>(
    doc.parseResult.value.models.flatMap(m => m.elements),
  )
  const relations = new LinkedList<ast.Relation | ast.Activity>()
  let el
  while ((el = traverseStack.shift())) {
    if (ast.isRelation(el) || ast.isActivity(el)) {
      relations.push(el)
      continue
    }
    if (el.body && el.body.elements && el.body.elements.length > 0) {
      for (const child of el.body.elements) {
        traverseStack.push(child)
      }
    }
    yield el
  }
  yield* relations
  return
}

export function ModelParser<TBase extends WithExpressionV2>(B: TBase) {
  return class ModelParser extends B {
    parseModel() {
      const doc = this.doc
      for (const el of streamModel(doc)) {
        try {
          if (!this.isValid(el)) {
            continue
          }
          if (ast.isElement(el)) {
            doc.c4Elements.push(this.parseElement(el))
            continue
          }
          if (ast.isRelation(el)) {
            doc.c4Relations.push(this.parseRelation(el))
            continue
          }
          if (ast.isActivity(el)) {
            doc.c4Activities.push(this.parseActivity(el))
            continue
          }
          if (ast.isExtendElement(el)) {
            const parsed = this.parseExtendElement(el)
            if (parsed) {
              doc.c4ExtendElements.push(parsed)
            }
            continue
          }
          nonexhaustive(el)
        } catch (e) {
          const astPath = this.getAstNodePath(el)
          const error = loggable(e)
          const message = e instanceof Error ? e.message : String(error)
          logger.warn(`Error on {eltype}: ${message}\n document: {path}\n astpath: {astPath}\n${error}`, {
            path: doc.uri.path,
            eltype: el.$type,
            astPath,
          })
        }
      }
    }

    parseElement(astNode: ast.Element): ParsedAstElement {
      const isValid = this.isValid
      const id = this.resolveFqn(astNode)
      const kind = nonNullable(astNode.kind.ref, 'Element kind is not resolved').name as c4.ElementKind
      const tags = this.parseTags(astNode.body)
      const style = this.parseElementStyle(astNode.body?.props)
      const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))
      const astPath = this.getAstNodePath(astNode)

      let [title, description, technology] = astNode.props ?? []

      const bodyProps = pipe(
        astNode.body?.props ?? [],
        filter(ast.isElementStringProperty),
        filter(p => isValid(p) && isNonNullish(p.value)),
        mapToObj(p => [p.key, p.value || undefined]),
      ) as {
        [key in ElementStringProperty['key']]?: string
      }

      title = removeIndent(title ?? bodyProps.title)
      description = removeIndent(bodyProps.description ?? description)
      technology = toSingleLine(bodyProps.technology ?? technology)

      const links = this.parseLinks(astNode.body)

      return {
        astPath,
        ...(metadata && { metadata }),
        ...(tags && { tags }),
        ...(links && { links }),
        ...(isTruthy(technology) && { technology }),
        ...(isTruthy(description) && { description }),
        style,
        title: title ?? astNode.name,
        kind,
        id,
      }
    }

    parseActivity(astNode: ast.Activity): ParsedAstActivity {
      const id = this.resolveFqn(astNode)
      const astPath = this.getAstNodePath(astNode)

      let { title, style, ...rest } = this.parseRelationProperties(astNode.body)

      title = removeIndent(astNode.title) ?? title

      const steps = flatMap(astNode.body?.steps ?? [], step => {
        try {
          return this.parseActivityStep(step)
        } catch (error) {
          logger.error('Failed to parse activity step', { error })
          return []
        }
      })
      return {
        steps,
        ...rest,
        ...(isTruthy(title) && { title }),
        astPath,
        name: astNode.name,
        id,
      }
    }

    parseExtendElement(astNode: ast.ExtendElement): ParsedAstExtend | null {
      const id = this.resolveFqn(astNode)
      const tags = this.parseTags(astNode.body)
      const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))
      const astPath = this.getAstNodePath(astNode)
      const links = this.parseLinks(astNode.body) ?? []

      if (!tags && isEmpty(metadata ?? {}) && isEmpty(links)) {
        return null
      }

      return {
        id,
        astPath,
        ...(metadata && { metadata }),
        ...(tags && { tags }),
        ...(links && isNonEmptyArray(links) && { links }),
      }
    }

    _resolveRelationSource(node: ast.Relation): FqnRef.ModelRef | FqnRef.ImportRef {
      if (isDefined(node.source)) {
        const source = this.parseFqnRef(node.source)
        invariant(FqnRef.isModelRef(source) || FqnRef.isImportRef(source), 'Relation source must be a model reference')
        return source
      }
      if (!ast.isElementBody(node.$container)) {
        throw new Error('RelationRefError: Invalid container for sourceless relation')
      }
      return {
        model: this.resolveFqn(node.$container.$container),
      }
    }

    parseRelation(astNode: ast.Relation): ParsedAstRelation {
      const isValid = this.isValid
      const source = this._resolveRelationSource(astNode)
      const target = this.parseFqnRef(astNode.target)
      invariant(
        FqnRef.isModelRef(target) || FqnRef.isImportRef(target) || FqnRef.isActivityRef(target),
        'Target must be a model reference',
      )

      const kind = astNode.kind?.ref?.name as (c4.RelationshipKind | undefined)
      const astPath = this.getAstNodePath(astNode)
      let { title, technology, tags, style, ...rest } = this.parseRelationProperties(astNode.body)
      tags = this.parseTags(astNode) ?? tags

      title = removeIndent(astNode.title) ?? title ?? ''
      technology = toSingleLine(astNode.technology) ?? technology

      const id = stringHash(
        astPath,
        source.model,
        FqnRef.toModelFqn(target),
      ) as c4.RelationId
      return {
        ...(kind && { kind }),
        ...(tags && { tags }),
        ...(isTruthy(technology) && { technology }),
        ...rest,
        ...style,
        astPath,
        title,
        target,
        source,
        id,
      }
    }

    parseActivityStep(astNode: ast.ActivityStep): ParsedAstActivityStep {
      const activityId = this.resolveFqn(astNode.$container.$container)
      const target = this.parseFqnRef(astNode.target)
      invariant(
        FqnRef.isModelRef(target) || FqnRef.isActivityRef(target) || FqnRef.isImportRef(target),
        'Target must be a model reference',
      )

      const kind = astNode.kind?.ref?.name as (c4.RelationshipKind | undefined)
      let { title, technology, tags, style, ...rest } = this.parseRelationProperties(astNode.body)
      tags = this.parseTags(astNode) ?? tags

      title = removeIndent(astNode.title) ?? title ?? ''
      technology = toSingleLine(astNode.technology) ?? technology

      const astPath = this.getAstNodePath(astNode)

      title = removeIndent(astNode.title) ?? title

      const id = stringHash(
        activityId,
        astPath,
        FqnRef.toModelFqn(target),
      ) as c4.RelationId
      return {
        ...(astNode.isBackward && { isBackward: astNode.isBackward }),
        ...rest,
        ...style,
        ...(isTruthy(technology) && { technology }),
        ...(tags && { tags }),
        ...(isTruthy(title) && { title }),
        ...(kind && { kind }),
        target,
        astPath,
        id,
      }
    }

    parseRelationProperties(body?: ast.ActivityBody | ast.RelationBody): {
      style: {
        tail?: c4.RelationshipArrowType
        head?: c4.RelationshipArrowType
        line?: c4.RelationshipLineType
        color?: c4.Color
      }
      description?: string
      technology?: string
      title?: string
      metadata?: { [key: string]: string }
      links?: c4.NonEmptyArray<c4.Link>
      tags?: c4.NonEmptyArray<c4.Tag>
      navigateTo?: c4.ViewId
    } {
      const allProps = body?.props ?? []
      const props = pipe(
        allProps,
        filter(ast.isRelationStringProperty),
        filter(p => this.isValid(p)),
        map(p => [p.key, removeIndent(p.value)] as [RelationStringProperty['key'], string]),
        filter(([_, value]) => isTruthy(value)),
        fromEntries(),
      )

      const navigateTo = pipe(
        allProps,
        filter(ast.isRelationNavigateToProperty),
        map(p => p.value.view.ref?.name),
        filter(isTruthy),
        first(),
      ) as c4.ViewId | undefined

      const tags = this.parseTags(body)
      const links = this.parseLinks(body)
      const metadata = this.getMetadata(allProps.find(ast.isMetadataProperty))

      const style = toRelationshipStyleExcludeDefaults(allProps.find(ast.isRelationStyleProperty)?.props, this.isValid)

      return {
        style,
        ...props,
        ...(navigateTo && { navigateTo }),
        ...(tags && { tags }),
        ...(links && { links }),
        ...(metadata && { metadata }),
      }
    }
  }
}
