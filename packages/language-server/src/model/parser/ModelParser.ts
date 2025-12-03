// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2025 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type * as c4 from '@likec4/core'
import { invariant, isNonEmptyArray, LinkedList, nonexhaustive, nonNullable } from '@likec4/core'
import { exact, FqnRef } from '@likec4/core/types'
import { loggable } from '@likec4/log'
import { filter, first, isDefined, isEmpty, isTruthy, map, mapToObj, pipe } from 'remeda'
import {
  type LikeC4LangiumDocument,
  type ParsedAstElement,
  type ParsedAstExtend,
  type ParsedAstExtendRelation,
  type ParsedAstRelation,
  ast,
  toRelationshipStyle,
} from '../../ast'
import { logger as mainLogger } from '../../logger'
import { stringHash } from '../../utils/stringHash'
import type { WithExpressionV2 } from './FqnRefParser'

export type WithModel = ReturnType<typeof ModelParser>

const logger = mainLogger.getChild('ModelParser')

function* streamModel(doc: LikeC4LangiumDocument) {
  const traverseStack = LinkedList.from(doc.parseResult.value.models.flatMap(m => m.elements))
  const relations = [] as ast.Relation[]
  let el
  while ((el = traverseStack.shift())) {
    if (ast.isRelation(el)) {
      relations.push(el)
      continue
    }
    // Skip ExtendRelation as it doesn't have child elements
    if (ast.isExtendRelation(el)) {
      yield el
      continue
    }
    if (el.body && 'elements' in el.body && el.body.elements && el.body.elements.length > 0) {
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
          if (ast.isElement(el)) {
            doc.c4Elements.push(this.parseElement(el))
            continue
          }
          if (ast.isRelation(el)) {
            if (this.isValid(el)) {
              doc.c4Relations.push(this.parseRelation(el))
            }
            continue
          }
          if (ast.isExtendElement(el)) {
            const parsed = this.parseExtendElement(el)
            if (parsed) {
              doc.c4ExtendElements.push(parsed)
            }
            continue
          }
          if (ast.isExtendRelation(el)) {
            const parsed = this.parseExtendRelation(el)
            if (parsed) {
              doc.c4ExtendRelations.push(parsed)
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

      let [_title, _summary, _technology] = astNode.props ?? []

      const bodyProps = pipe(
        astNode.body?.props ?? [],
        filter(isValid),
        filter(ast.isElementStringProperty),
        mapToObj(p => [p.key, p.value as ast.MarkdownOrString | undefined]),
      )

      const { title, ...descAndTech } = this.parseBaseProps(bodyProps, {
        title: _title,
        summary: _summary,
        technology: _technology,
      })

      const links = this.parseLinks(astNode.body)

      return exact({
        id,
        kind,
        astPath,
        title: title ?? astNode.name,
        metadata,
        tags: tags ?? undefined,
        ...(links && isNonEmptyArray(links) && { links }),
        ...descAndTech,
        style,
      })
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

      return exact({
        id,
        astPath,
        metadata,
        tags,
        links: isNonEmptyArray(links) ? links : null,
      })
    }

    parseExtendRelation(astNode: ast.ExtendRelation): ParsedAstExtendRelation | null {
      const source = this.parseFqnRef(astNode.source)
      const target = this.parseFqnRef(astNode.target)
      invariant(FqnRef.isModelRef(source) || FqnRef.isImportRef(source), 'Source must be a model reference')
      invariant(FqnRef.isModelRef(target) || FqnRef.isImportRef(target), 'Target must be a model reference')

      const tags = this.parseTags(astNode.body)
      const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))
      const astPath = this.getAstNodePath(astNode)
      const links = this.parseLinks(astNode.body) ?? []

      if (!tags && isEmpty(metadata ?? {}) && isEmpty(links)) {
        return null
      }

      // Generate a stable relation ID based on source, target, kind, and title
      // This allows extends to match specific relations between elements
      const kind = (astNode.kind ?? astNode.dotKind?.kind)?.ref?.name as (c4.RelationshipKind | undefined)

      // Normalize title the same way as parseRelation does
      const { title = '' } = this.parseBaseProps({}, { title: astNode.title })

      const id = stringHash(
        'extend-relation',
        FqnRef.flatten(source),
        FqnRef.flatten(target),
        kind ?? 'default',
        title,
      ) as c4.RelationId

      return exact({
        id,
        astPath,
        metadata,
        tags,
        links: isNonEmptyArray(links) ? links : null,
      })
    }

    _resolveRelationSource(node: ast.Relation): FqnRef.ModelRef | FqnRef.ImportRef {
      if (isDefined(node.source)) {
        const source = this.parseFqnRef(node.source)
        invariant(FqnRef.isModelRef(source) || FqnRef.isImportRef(source), 'Relation source must be a model reference')
        return source
      }
      if (ast.isElementBody(node.$container)) {
        return {
          model: this.resolveFqn(node.$container.$container),
        }
      }
      if (ast.isExtendElementBody(node.$container)) {
        return {
          model: this.resolveFqn(node.$container.$container),
        }
      }
      throw new Error('RelationRefError: Invalid container for sourceless relation')
    }

    parseRelation(astNode: ast.Relation): ParsedAstRelation {
      const isValid = this.isValid
      const source = this._resolveRelationSource(astNode)
      const target = this.parseFqnRef(astNode.target)
      invariant(FqnRef.isModelRef(target) || FqnRef.isImportRef(target), 'Target must be a model reference')

      const tags = this.parseTags(astNode) ?? this.parseTags(astNode.body)
      const links = this.parseLinks(astNode.body)
      const kind = (astNode.kind ?? astNode.dotKind?.kind)?.ref?.name as (c4.RelationshipKind | undefined)
      const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))
      const astPath = this.getAstNodePath(astNode)

      const bodyProps = pipe(
        astNode.body?.props ?? [],
        filter(ast.isRelationStringProperty),
        filter(p => isTruthy(p.value)),
        mapToObj(p => [p.key, p.value as ast.MarkdownOrString | undefined]),
      )

      const navigateTo = pipe(
        astNode.body?.props ?? [],
        filter(ast.isRelationNavigateToProperty),
        map(p => p.value.view.ref?.name),
        filter(isTruthy),
        first(),
      )
      const { title = '', description, technology } = this.parseBaseProps(bodyProps, {
        // inline props
        title: astNode.title,
        description: astNode.description,
        technology: astNode.technology,
      })

      const styleProp = astNode.body?.props.find(ast.isRelationStyleProperty)
      const id = stringHash(
        astPath,
        source.model,
        target.model,
      ) as c4.RelationId
      return exact({
        id,
        astPath,
        source,
        target,
        title,
        metadata,
        kind,
        tags: tags ?? undefined,
        links: isNonEmptyArray(links) ? links : undefined,
        navigateTo: navigateTo ? navigateTo as c4.ViewId : undefined,
        description,
        technology,
        ...toRelationshipStyle(styleProp?.props, isValid),
      })
    }
  }
}
