import { invariant } from '@likec4/core'
import { DiffId, FqnRef } from '@likec4/core/types'
import { filter, mapToObj, partition, pipe } from 'remeda'
import {
  type ParsedAstDiff,
  type ParsedAstDiffElementRemoval,
  type ParsedAstDiffRelationRemoval,
  type ParsedAstElement,
  type ParsedAstExtend,
  type ParsedAstRelation,
  ast,
} from '../../ast'
import { relationFingerprint } from '../relationFingerprint'
import { toSingleLine } from './Base'
import type { WithModel } from './ModelParser'
import { streamModelElements } from './ModelParser'

export function DiffParser<TBase extends WithModel>(B: TBase) {
  return class DiffParser extends B {
    parseDiffs() {
      const doc = this.doc
      for (const diffAst of doc.parseResult.value.diffs) {
        try {
          doc.c4Diffs.push(this.parseDiff(diffAst))
        } catch (e) {
          this.logError(e, diffAst, 'diff')
        }
      }
    }

    parseDiff(astNode: ast.ModelDiff): ParsedAstDiff {
      const props = pipe(
        astNode.props,
        filter(this.isValid),
        mapToObj(p => [p.key, p.value as ast.MarkdownOrString | undefined]),
      )
      const { title = null, description = null } = this.parseBaseProps(props, {
        title: astNode.title,
      })

      const [removeElements, removeRelations] = partition(
        this.tryMap('diff', astNode.removes.flatMap(r => r.entries), entry => this.parseRemoveEntry(entry)),
        (removal): removal is ParsedAstDiffElementRemoval => 'fqn' in removal,
      )

      const elements = [] as ParsedAstElement[]
      const relations = [] as ParsedAstRelation[]
      const extendElements = [] as ParsedAstExtend[]
      for (const el of streamModelElements(astNode.adds.flatMap(a => a.elements))) {
        try {
          switch (true) {
            case ast.isElement(el):
              elements.push(this.parseElement(el))
              break
            case ast.isRelation(el):
              relations.push(this.parseRelation(el))
              break
            case ast.isExtendElement(el): {
              const parsed = this.parseExtendElement(el)
              if (parsed) {
                extendElements.push(parsed)
              }
              break
            }
              // Relation extends are reported by validation
          }
        } catch (e) {
          this.logError(e, el, 'diff')
        }
      }

      return {
        id: DiffId(astNode.name),
        title: toSingleLine(title) ?? null,
        description,
        removeElements,
        removeRelations,
        elements,
        relations,
        extendElements,
        docUri: this.doc.uri.toString(),
        views: [],
      }
    }

    /**
     * Parses a `remove` entry: an element, or a relation identified by its fingerprint.
     * Throws if the source or the target is not a model element.
     */
    parseRemoveEntry(entry: ast.DiffRemoveEntry): ParsedAstDiffElementRemoval | ParsedAstDiffRelationRemoval {
      const source = this.parseFqnRef(entry.source)
      invariant(FqnRef.isElementRef(source), 'Removed element must be a model element')
      if (!entry.target) {
        return { fqn: FqnRef.flatten(source) }
      }
      const target = this.parseFqnRef(entry.target)
      invariant(FqnRef.isElementRef(target), 'Relation target must be a model element')
      return {
        fingerprint: relationFingerprint({
          source,
          target,
          kind: (entry.kind ?? entry.dotKind?.kind)?.ref?.name,
          title: this.parseBaseProps({}, { title: entry.title }).title,
          isBidirectional: entry.isBidirectional,
        }),
      }
    }
  }
}
