import { invariant } from '@likec4/core'
import { type LangiumDocument, DocumentCache, DocumentState } from 'langium'
import DefaultWeakMap from 'mnemonist/default-weak-map'
import { pipe } from 'remeda'
import type { LikeC4DocumentProps, ParsedLikeC4LangiumDocument } from '../ast'
import { isFqnIndexedDocument } from '../ast'
import type { LikeC4Services } from '../module'
import { BaseParser } from './parser/Base'
import { DeploymentModelParser } from './parser/DeploymentModelParser'
import { DeploymentViewParser } from './parser/DeploymentViewParser'
import { ExpressionV2Parser } from './parser/FqnRefParser'
import { GlobalsParser } from './parser/GlobalsParser'
import { ModelParser } from './parser/ModelParser'
import { PredicatesParser } from './parser/PredicatesParser'
import { SpecificationParser } from './parser/SpecificationParser'
import { ViewsParser } from './parser/ViewsParser'

export type ModelParsedListener = () => void

const DocumentParserFromMixins = pipe(
  BaseParser,
  ExpressionV2Parser,
  ModelParser,
  DeploymentModelParser,
  DeploymentViewParser,
  PredicatesParser,
  SpecificationParser,
  ViewsParser,
  GlobalsParser,
)

export class DocumentParser extends DocumentParserFromMixins {
}

export class LikeC4ModelParser {
  private cachedParsers: DocumentCache<string, DocumentParser>

  constructor(private services: LikeC4Services) {
    this.cachedParsers = new DocumentCache(services.shared, DocumentState.Validated)
  }

  parse(doc: LangiumDocument): ParsedLikeC4LangiumDocument {
    invariant(isFqnIndexedDocument(doc), `Not a FqnIndexedDocument: ${doc.uri.toString(true)}`)
    try {
      const props: Required<Omit<LikeC4DocumentProps, 'c4fqnIndex' | 'diagnostics'>> = {
        c4Specification: {
          tags: new Set(),
          elements: {},
          relationships: {},
          colors: {},
          deployments: {},
        },
        c4Elements: [],
        c4Relations: [],
        c4Deployments: [],
        c4DeploymentRelations: [],
        c4Globals: {
          predicates: {},
          dynamicPredicates: {},
          styles: {},
        },
        c4Views: [],
      }
      doc = Object.assign(doc, props)
      const parser = this.forDocument(doc)
      parser.parseSpecification()
      parser.parseModel()
      parser.parseGlobals()
      parser.parseDeployment()
      parser.parseViews()
      return parser.doc
    } catch (cause) {
      throw new Error(`Error parsing document ${doc.uri.toString()}`, { cause })
    }
  }

  forDocument(doc: LangiumDocument): DocumentParser {
    invariant(isFqnIndexedDocument(doc), `Not a FqnIndexedDocument: ${doc.uri.toString(true)}`)
    return this.cachedParsers.get(
      doc.uri,
      'DocumentParser',
      () => new DocumentParser(this.services, doc as ParsedLikeC4LangiumDocument),
    )
  }
}
