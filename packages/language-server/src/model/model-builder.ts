import { ModelIndex, assignNavigateTo, computeView, invariant } from '@likec4/core'
import type * as c4 from '@likec4/core/types'
import { DefaultElementShape, DefaultThemeColor } from '@likec4/core/types'
import { compareByFqnHierarchically, isNonEmptyArray, parentFqn } from '@likec4/core/utils'
import type { AstNode, LangiumDocuments } from 'langium'
import { DocumentState, getDocument } from 'langium'
import objectHash from 'object-hash'
import { clone } from 'rambdax'
import * as R from 'remeda'

import stripIndent from 'strip-indent'

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
import type { CancellationToken } from 'vscode-languageserver-protocol'

export class LikeC4ModelBuilder {
  private fqnIndex: FqnIndex
  private langiumDocuments: LangiumDocuments

  private readonly cachedModel: {
    last?: ReturnType<LikeC4ModelBuilder['buildModel']>
  } = {}
  constructor(private services: LikeC4Services) {
    this.fqnIndex = services.likec4.FqnIndex
    this.langiumDocuments = services.shared.workspace.LangiumDocuments

    services.shared.workspace.DocumentBuilder.onBuildPhase(
      DocumentState.Validated,
      (docs, cancelToken) => {
        let countOfChangedDocs = 0
        for (const doc of docs) {
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
        if (countOfChangedDocs > 0) {
          this.cleanCache()
          this.notifyClient(cancelToken)
        }
      }
    )
  }

  private cleanCache() {
    delete this.cachedModel.last
  }

  private documents() {
    return this.langiumDocuments.all.filter(isValidLikeC4LangiumDocument).toArray()
  }

  public buildModel(): c4.LikeC4Model | null {
    if ('last' in this.cachedModel) {
      logger.debug('returning cached model')
      return this.cachedModel.last
    }
    return (this.cachedModel.last = this._buildModel())
  }

  private _buildModel(): c4.LikeC4Model | null {
    logger.debug('_buildModel')
    const docs = this.documents()
    if (docs.length === 0) {
      logger.debug('No documents to build model from')
      return null
    }
    // TODO:
    try {
      const c4Specification: ParsedAstSpecification = {
        kinds: {}
      }
      R.forEach(R.map(docs, R.prop('c4Specification')), spec =>
        Object.assign(c4Specification.kinds, spec.kinds)
      )

      const toModelElement = ({ astPath, tags, links, ...parsed }: ParsedAstElement): c4.Element | null => {
        const kind = c4Specification.kinds[parsed.kind]
        if (kind) {
          return {
            shape: kind.shape,
            color: kind.color,
            description: null,
            technology: null,
            tags: tags ?? null,
            links: links ?? null,
            ...parsed
          }
        }
        return null
      }

      const elements = R.pipe(
        R.flatMap(docs, d => d.c4Elements),
        R.map(toModelElement),
        R.compact,
        R.sort(compareByFqnHierarchically),
        R.reduce(
          (acc, el) => {
            const parent = parentFqn(el.id)
            if (parent && R.isNil(acc[parent])) {
              logger.warn(`No parent found for ${el.id}`)
              return acc
            }
            if (el.id in acc) {
              // should not happen, as validated
              logger.warn(`Duplicate element id: ${el.id}`)
              return acc
            }
            acc[el.id] = el
            return acc
          },
          {} as c4.LikeC4Model['elements']
        )
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
        let { astPath, rules, title, description, tags, links, ...model } = view
        if (!title && view.viewOf) {
          title = elements[view.viewOf]?.title
        }
        if (!title && view.id === 'index') {
          title = 'Landscape view'
        }
        return computeView(
          {
            ...model,
            title: title ?? null,
            description: description ?? null,
            tags: tags ?? null,
            links: links ?? null,
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
      return null
    }
  }

  /**
   * @returns if the document was changed
   */
  protected parseDocument(doc: LikeC4LangiumDocument) {
    const { elements, relations, views, specification } = cleanParsedModel(doc)

    const specs = doc.parseResult.value.specification?.specs.filter(ast.isSpecificationElementKind)
    if (specs) {
      for (const { kind, style } of specs) {
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
    const tags = (astNode.body && this.convertTags(astNode.body))
    const styleProps = astNode.body?.props.find(ast.isElementStyleProperties)?.props
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

    const links = astNode.body?.props.filter(ast.isLinkProperty).map(p => p.value)

    return {
      id,
      kind,
      astPath,
      title: title ?? astNode.name,
      ...(tags && { tags }),
      ...(links && isNonEmptyArray(links) && { links }),
      ...(technology && { technology }),
      ...(description && { description: stripIndent(description).trim() }),
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
    const title = astNode.title ?? astNode.body?.props.find(p => p.key === 'title')?.value ?? ''
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

    const title = astNode.props.find(p => p.key === 'title')?.value
    const description = astNode.props.find(p => p.key === 'description')?.value

    const tags = this.convertTags(astNode)
    const links = astNode.props.filter(ast.isLinkProperty).map(p => p.value)

    return {
      id,
      astPath,
      ...(viewOf && { viewOf }),
      ...(title && { title }),
      ...(description && { description }),
      ...(tags && { tags }),
      ...(links && isNonEmptyArray(links) && { links }),
      rules: astNode.rules.map(n => this.parseViewRule(n))
    }
  }

  protected resolveFqn(node: ast.Element | ast.ExtendElement) {
    if (ast.isExtendElement(node)) {
      return strictElementRefFqn(node.element)
    }
    const fqn = this.fqnIndex.getFqn(node)
    invariant(fqn, `Not indexed element: ${this.getAstNodePath(node)}`)
    return fqn
  }

  private getAstNodePath(node: AstNode) {
    return this.services.workspace.AstNodeLocator.getAstNodePath(node)
  }

  private convertTags(el: { tags?: ast.Tags }) {
    const tags = el.tags?.value.map(tagRef => tagRef.ref?.name as c4.Tag)
    return tags && isNonEmptyArray(tags) ? tags : null
  }

  private scheduledCb: NodeJS.Timeout | null = null
  private notifyClient(cancelToken: CancellationToken) {
    const connection = this.services.shared.lsp.Connection
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
      if (!cancelToken.isCancellationRequested) {
        void connection.sendNotification(Rpc.onDidChangeModel, '')
      }
    }, 300)
  }
}
