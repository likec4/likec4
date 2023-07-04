import { ModelIndex, assignNavigateTo, computeView } from '@likec4/core'
import type * as c4 from '@likec4/core/types'
import { DefaultElementShape, DefaultThemeColor } from '@likec4/core/types'
import { compareByFqnHierarchically, parentFqn } from '@likec4/core/utils'
import type { AstNode, LangiumDocuments } from 'langium'
import { DocumentState, getDocument } from 'langium'
import objectHash from 'object-hash'
import { clone, isNil } from 'rambdax'
import * as R from 'remeda'

import invariant from 'tiny-invariant'
import type {
  ParsedAstElement,
  ParsedAstElementView,
  ParsedAstRelation,
  ParsedAstSpecification
} from '../ast'
import {
  ElementViewOps,
  ast,
  cleanParsedModel,
  isLikeC4LangiumDocument,
  isValidLikeC4LangiumDocument,
  resolveRelationPoints,
  streamModel,
  toAutoLayout,
  toElementStyle,
  type LikeC4LangiumDocument
} from '../ast'
import { elementRef, strictElementRefFqn } from '../elementRef'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import { Rpc } from '../protocol'
import { failExpectedNever } from '../utils'
import type { FqnIndex } from './fqn-index'
import stripIndent from 'strip-indent'

export class LikeC4ModelBuilder {
  private fqnIndex: FqnIndex
  private langiumDocuments: LangiumDocuments

  constructor(private services: LikeC4Services) {
    this.fqnIndex = services.likec4.FqnIndex
    this.langiumDocuments = services.shared.workspace.LangiumDocuments

    services.shared.workspace.DocumentBuilder.onBuildPhase(
      DocumentState.Validated,
      (docs, cancelToken) => {
        let countOfChangedDocs = 0
        for (const doc of docs) {
          if (cancelToken.isCancellationRequested) {
            break
          }
          if (!isLikeC4LangiumDocument(doc)) {
            continue
          }
          countOfChangedDocs++
          try {
            this.parseDocument(doc)
          } catch (e) {
            logger.error(`Error parsing document ${doc.uri.toString()}`)
            logger.error(e)
          }
        }
        if (countOfChangedDocs > 0 && !cancelToken.isCancellationRequested) {
          this.notifyClient()
        }
      }
    )
  }

  private get connection() {
    return this.services.shared.lsp.Connection
  }

  private documents() {
    return this.langiumDocuments.all.filter(isValidLikeC4LangiumDocument).toArray()
  }

  public buildModel(): c4.LikeC4Model | undefined {
    const docs = this.documents()
    if (docs.length === 0) {
      logger.debug('No documents to build model from')
      return
    }
    // TODO:
    try {
      const c4Specification: ParsedAstSpecification = {
        kinds: {}
      }
      R.forEach(R.map(docs, R.prop('c4Specification')), spec =>
        Object.assign(c4Specification.kinds, spec.kinds)
      )

      const toModelElement = (el: ParsedAstElement): c4.Element | null => {
        const kind = c4Specification.kinds[el.kind]
        if (kind) {
          const { astPath, ...model } = el
          return {
            ...(kind.shape !== DefaultElementShape ? { shape: kind.shape } : {}),
            ...(kind.color !== DefaultThemeColor ? { color: kind.color } : {}),
            ...model
          }
        }
        return null
      }

      const elements = R.pipe(
        R.flatMap(docs, d => d.c4Elements),
        R.map(toModelElement),
        R.compact,
        R.sort(compareByFqnHierarchically),
        R.reduce((acc, el) => {
          const parent = parentFqn(el.id)
          if (!parent || parent in acc) {
            if (el.id in acc) {
              logger.warn(`Duplicate element id: ${el.id}`)
              return acc
            }
            acc[el.id] = el
          }
          return acc
        }, {} as c4.LikeC4Model['elements'])
      )

      const toModelRelation = ({
        astPath,
        source,
        target,
        ...model
      }: ParsedAstRelation): c4.Relation | null => {
        if (source in elements && target in elements) {
          return {
            source,
            target,
            ...model
          }
        }
        return null
      }

      const relations = R.pipe(
        R.flatMap(docs, d => d.c4Relations),
        R.map(toModelRelation),
        R.compact,
        R.mapToObj(r => [r.id, r])
      )

      const modelIndex = ModelIndex.from({ elements, relations })

      const toModelView = (view: ParsedAstElementView): c4.ComputedView | null => {
        // eslint-disable-next-line prefer-const
        let { astPath, rules, title, ...model } = view
        if (!title && view.viewOf) {
          title = elements[view.viewOf]?.title
        }
        if (!title && view.id === 'index') {
          title = 'Landscape view'
        }
        return computeView(
          {
            ...model,
            ...(title && { title }),
            rules: clone(rules)
          },
          modelIndex
        )
      }

      const views = R.pipe(
        R.flatMap(docs, d => d.c4Views),
        R.map(toModelView),
        R.compact
      )

      assignNavigateTo(views)

      return {
        elements,
        relations,
        views: R.mapToObj(views, v => [v.id, v])
      }
    } catch (e) {
      logger.error(e)
      return
    }
  }

  /**
   * @returns if the document was changed
   */
  protected parseDocument(doc: LikeC4LangiumDocument) {
    const { elements, relations, views, specification } = cleanParsedModel(doc)

    const spec = doc.parseResult.value.specification
    if (spec) {
      for (const { kind, style } of spec.elementKinds) {
        try {
          const styleProps = toElementStyle(style?.props)
          specification.kinds[kind.name as c4.ElementKind] = {
            color: styleProps.color ?? DefaultThemeColor,
            shape: styleProps.shape ?? DefaultElementShape
          }
        } catch (e) {
          logger.warn(e)
        }
      }
    }

    for (const el of streamModel(doc)) {
      if (ast.isElement(el)) {
        try {
          elements.push(this.parseElement(el))
        } catch (e) {
          logger.warn(e)
        }
        continue
      }
      if (ast.isRelation(el)) {
        try {
          relations.push(this.parseRelation(el))
        } catch (e) {
          logger.warn(e)
        }
        continue
      }
      failExpectedNever(el)
    }
    const docviews = doc.parseResult.value.views?.views
    if (docviews) {
      for (const view of docviews) {
        try {
          const v = this.parseElementView(view)
          ElementViewOps.writeId(view, v.id)
          views.push(v)
        } catch (e) {
          logger.warn(e)
        }
      }
    }
    // const prevHash = doc.c4hash ?? ''
    // doc.c4hash = c4hash(doc)
    // return prevHash !== doc.c4hash
  }

  private parseElement(astNode: ast.Element): ParsedAstElement {
    const id = this.resolveFqn(astNode)
    invariant(astNode.kind.ref, 'Element kind is not resolved: ' + astNode.name)
    const kind = astNode.kind.ref.name as c4.ElementKind
    const tags = (astNode.body && this.convertTags(astNode.body)) ?? []
    const styleProps = astNode.body?.props.find(ast.isElementStyleProperty)?.props
    const { color, shape } = toElementStyle(styleProps)
    const astPath = this.getAstNodePath(astNode)

    let [title, description, technology] = astNode.props

    const bodyProps =
      astNode.body?.props.filter((p): p is ast.ElementStringProperty =>
        ast.isElementStringProperty(p)
      ) ?? []

    title = title ?? bodyProps.find(p => p.key === 'title')?.value
    description = description ?? bodyProps.find(p => p.key === 'description')?.value
    technology = technology ?? bodyProps.find(p => p.key === 'technology')?.value

    return {
      id,
      kind,
      astPath,
      title: title ?? astNode.name,
      ...(technology && { technology }),
      ...(description && { description: stripIndent(description).trim() }),
      ...(tags.length > 0 ? { tags } : {}),
      ...(shape && shape !== DefaultElementShape ? { shape } : {}),
      ...(color && color !== DefaultThemeColor ? { color } : {})
    }
  }

  private parseRelation(astNode: ast.Relation): ParsedAstRelation {
    const coupling = resolveRelationPoints(astNode)
    const target = this.resolveFqn(coupling.target)
    const source = this.resolveFqn(coupling.source)
    const hashdata = {
      astPath: this.getAstNodePath(astNode),
      source,
      target
    }
    const id = objectHash(hashdata) as c4.RelationID
    const title =
      astNode.title ?? astNode.definition?.props.find(p => p.key === 'title')?.value ?? ''
    return {
      id,
      ...hashdata,
      title
    }
  }

  private parseElementExpression(astNode: ast.ElementExpression): c4.ElementExpression {
    if (ast.isWildcardExpression(astNode)) {
      return {
        wildcard: true
      }
    }
    if (ast.isElementKindExpression(astNode)) {
      invariant(
        astNode.kind.ref,
        'ElementKindExpression kind is not resolved: ' + astNode.$cstNode?.text
      )
      return {
        elementKind: astNode.kind.ref.name as c4.ElementKind,
        isEqual: astNode.isEqual
      }
    }
    if (ast.isElementTagExpression(astNode)) {
      invariant(
        astNode.tag.ref,
        'ElementTagExpression tag is not resolved: ' + astNode.$cstNode?.text
      )
      return {
        elementTag: astNode.tag.ref.name as c4.Tag,
        isEqual: astNode.isEqual
      }
    }
    if (ast.isElementRefExpression(astNode)) {
      const element = elementRef(astNode.id)
      invariant(element, 'Element not found ' + astNode.id.$cstNode?.text)
      return {
        element: this.resolveFqn(element),
        isDescedants: astNode.isDescedants
      }
    }
    failExpectedNever(astNode)
  }

  private parseExpression(astNode: ast.Expression): c4.Expression {
    if (ast.isElementExpression(astNode)) {
      return this.parseElementExpression(astNode)
    }
    if (ast.isIncomingExpression(astNode)) {
      return {
        incoming: this.parseElementExpression(astNode.target)
      }
    }
    if (ast.isOutgoingExpression(astNode)) {
      return {
        outgoing: this.parseElementExpression(astNode.source)
      }
    }
    if (ast.isInOutExpression(astNode)) {
      return {
        inout: this.parseElementExpression(astNode.inout.target)
      }
    }
    if (ast.isRelationExpression(astNode)) {
      return {
        source: this.parseElementExpression(astNode.source),
        target: this.parseElementExpression(astNode.target)
      }
    }
    failExpectedNever(astNode)
  }

  private parseViewRule(astRule: ast.ViewRule): c4.ViewRule {
    if (ast.isViewRuleExpression(astRule)) {
      const exprs = astRule.expressions.map(n => this.parseExpression(n))
      return {
        isInclude: astRule.isInclude,
        exprs
      }
    }
    if (ast.isViewRuleStyle(astRule)) {
      const styleProps = toElementStyle(astRule.props)
      return {
        targets: astRule.targets.map(n => this.parseElementExpression(n)),
        style: {
          ...styleProps
        }
      }
    }
    if (ast.isViewRuleAutoLayout(astRule)) {
      return {
        autoLayout: toAutoLayout(astRule.direction)
      }
    }
    failExpectedNever(astRule)
  }

  private parseElementView(astNode: ast.ElementView): ParsedAstElementView {
    const viewOfEl = astNode.viewOf && elementRef(astNode.viewOf)
    const viewOf = viewOfEl && this.resolveFqn(viewOfEl)
    const astPath = this.getAstNodePath(astNode)
    let id = astNode.name as c4.ViewID | undefined
    if (!id) {
      const doc = getDocument(astNode).uri.toString()
      id = objectHash({
        doc,
        astPath,
        viewOf: viewOf ?? null
      }) as c4.ViewID
    }

    const title = astNode.properties.find(p => p.key === 'title')?.value
    const description = astNode.properties.find(p => p.key === 'description')?.value

    return {
      id,
      astPath,
      ...(viewOf && { viewOf }),
      ...(title && { title }),
      ...(description && { description }),
      rules: astNode.rules.map(n => this.parseViewRule(n))
    }
  }

  protected resolveFqn(node: ast.Element | ast.ExtendElement) {
    if (ast.isExtendElement(node)) {
      return strictElementRefFqn(node.element)
    }
    const fqn = this.fqnIndex.get(node)
    invariant(fqn, `Not indexed element: ${this.getAstNodePath(node)}`)
    return fqn
  }

  private getAstNodePath(node: AstNode) {
    return this.services.workspace.AstNodeLocator.getAstNodePath(node)
  }

  private convertTags(el: { tags?: ast.Tags }) {
    return el.tags?.value.map(tagRef => tagRef.ref?.name as c4.Tag) ?? []
  }

  private scheduledCb: NodeJS.Timeout | null = null
  private notifyClient() {
    const connection = this.connection
    if (!connection) {
      return
    }
    if (this.scheduledCb) {
      logger.debug('debounce scheduled onDidChangeModel')
      clearTimeout(this.scheduledCb)
    }
    this.scheduledCb = setTimeout(() => {
      logger.debug('send onDidChangeModel')
      this.scheduledCb = null
      void connection.sendNotification(Rpc.onDidChangeModel, '')
    }, 350)
  }
}
