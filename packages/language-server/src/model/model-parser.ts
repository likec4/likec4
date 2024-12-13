import { invariant } from '@likec4/core'
import type { LangiumDocument } from 'langium'
import DefaultWeakMap from 'mnemonist/default-weak-map'
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

const DocumentParserFromMixins = GlobalsParser(
  ViewsParser(
    SpecificationParser(
      PredicatesParser(
        DeploymentViewParser(
          DeploymentModelParser(
            ModelParser(
              ExpressionV2Parser(BaseParser)
            )
          )
        )
      )
    )
  )
)

class DocumentParser extends DocumentParserFromMixins {
}

export class LikeC4ModelParser {
  private cachedParsers = new DefaultWeakMap<LangiumDocument, DocumentParser>((doc: LangiumDocument) =>
    new DocumentParser(this.services, doc as ParsedLikeC4LangiumDocument)
  )

  constructor(private services: LikeC4Services) {
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
          deployments: {}
        },
        c4Elements: [],
        c4Relations: [],
        c4Deployments: [],
        c4DeploymentRelations: [],
        c4Globals: {
          predicates: {},
          dynamicPredicates: {},
          styles: {}
        },
        c4Views: []
      }
      doc = Object.assign(doc, props)
      const parser = this.cachedParsers.get(doc)
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
    return this.cachedParsers.get(doc)
  }
}
