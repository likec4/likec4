// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { ProjectId } from '@likec4/core'
import { hasProp, invariant, MultiMap, objectHash } from '@likec4/core/utils'
import { type LangiumDocument, type Stream, DocumentState, UriUtils } from 'langium'
import { pipe } from 'remeda'
import {
  type LikeC4DocumentProps,
  type LikeC4LangiumDocument,
  type ParsedLikeC4LangiumDocument,
  hasValidationErrors,
  isLikeC4LangiumDocument,
  isLikeC4UserDocument,
  isParsedLikeC4LangiumDocument,
  isValidationStateChanged,
  LikeC4DocumentPropKeys,
} from '../ast'
import { logger as rootLogger } from '../logger'
import type { LikeC4Services } from '../module'
import { ADisposable } from '../utils'
import { BaseParser } from './parser/Base'
import { DeploymentModelParser } from './parser/DeploymentModelParser'
import { DeploymentViewParser } from './parser/DeploymentViewParser'
import { ExpressionV2Parser } from './parser/FqnRefParser'
import { GlobalsParser } from './parser/GlobalsParser'
import { ImportsParser } from './parser/ImportsParser'
import { ModelParser } from './parser/ModelParser'
import { PredicatesParser } from './parser/PredicatesParser'
import { SpecificationParser } from './parser/SpecificationParser'
import { ViewsParser } from './parser/ViewsParser'

export type ModelParsedListener = () => void

const DocumentParserFromMixins = pipe(
  BaseParser,
  ExpressionV2Parser,
  ImportsParser,
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

export class LikeC4ModelParser extends ADisposable {
  #logger = rootLogger.getChild('parser')

  constructor(private services: LikeC4Services) {
    super()

    this.onDispose(
      // Clear cached parser when document is unlinked
      services.shared.workspace.DocumentBuilder.onDocumentResetBelow(
        DocumentState.Linked,
        ({ doc, resetTo, previous }) => {
          this.#logger.trace(
            'clear cached parser {doc} on reset below Linked (resetTo: {resetTo}, was: {previous})',
            {
              doc: services.shared.workspace.WorkspaceManager.relativePath(doc.uri),
              resetTo,
              previous,
            },
          )
          this.cleanParserState(doc)
        },
      ),
      // Parse documents when they are linked
      services.shared.workspace.DocumentBuilder.onDocumentPhase(
        DocumentState.Linked,
        async doc => {
          if (isParsedLikeC4LangiumDocument(doc) && doc.likec4Parser.isCached) {
            this.#logger.warn('Document {doc} was validated, we will reparse it', {
              doc: services.shared.workspace.WorkspaceManager.relativePath(doc.uri),
            })
          }
          this.createParser(doc)
        },
      ),
      services.shared.workspace.DocumentBuilder.onDocumentPhase(
        DocumentState.Validated,
        async doc => {
          this.reparseIfNeeded(doc)
        },
      ),
    )
  }

  documents(projectId: ProjectId): Stream<ParsedLikeC4LangiumDocument> {
    return this.services.shared.workspace.LangiumDocuments.projectDocuments(projectId).map(
      d => this.parse(d),
    )
  }

  parse(doc: LangiumDocument): ParsedLikeC4LangiumDocument {
    const parser = this.forDocument(doc)
    return parser.doc
  }

  forDocument(doc: LangiumDocument): DocumentParser {
    invariant(isLikeC4LangiumDocument(doc), `Document ${doc.uri.toString()} is not a LikeC4 document`)
    return doc.likec4Parser ??= this.createParser(doc)
  }

  private cleanParserState(doc: LikeC4LangiumDocument): void {
    doc.likec4Parser?.dispose()
    for (const key of LikeC4DocumentPropKeys) {
      delete doc[key]
    }
  }

  private reparseIfNeeded(doc: LangiumDocument): DocumentParser {
    invariant(isLikeC4LangiumDocument(doc), `Document ${doc.uri.toString()} is not a LikeC4 document`)
    if (!doc.likec4Parser || isValidationStateChanged(doc, doc.likec4Parser)) {
      return this.createParser(doc)
    }
    doc.likec4Parser.isCached = true
    return doc.likec4Parser
  }

  private createParser(doc: LangiumDocument): DocumentParser {
    invariant(isLikeC4LangiumDocument(doc), `Document ${doc.uri.toString()} is not a LikeC4 document`)
    this.cleanParserState(doc)
    const project = this.services.shared.workspace.ProjectsManager.getProject(doc)
    const docpath = UriUtils.relative(project.folderUri, doc.uri)
    this.#logger.trace(`project {project}, create parser {doc}`, {
      project: project.id,
      doc: docpath,
    })
    if (doc.state < DocumentState.Linked) {
      this.#logger.error(`document {doc} is not linked, state is {state}`, {
        doc: docpath,
        state: doc.state,
      })
    }

    const props: Omit<Required<LikeC4DocumentProps>, 'diagnostics' | 'likec4Parser'> = {
      c4Specification: {
        tags: {},
        elements: {},
        relationships: {},
        colors: {},
        deployments: {},
      },
      c4Elements: [],
      c4ExtendElements: [],
      c4ExtendDeployments: [],
      c4ExtendRelations: [],
      c4Relations: [],
      c4Deployments: [],
      c4DeploymentRelations: [],
      c4Globals: {
        predicates: {},
        dynamicPredicates: {},
        styles: {},
      },
      c4Views: [],
      c4Imports: new MultiMap(Set),
    }
    const parser = new DocumentParser(
      this.services,
      Object.assign(doc, props) as ParsedLikeC4LangiumDocument,
      project,
    )
    try {
      parser.parseSpecification()
      parser.parseImports()
      parser.parseModel()
      parser.parseDeployment()
      parser.parseGlobals()
      parser.parseViews()
    } catch (error) {
      this.cleanParserState(doc)
      this.#logger.warn({
        message: 'error parsing document',
        project: project.id,
        doc: docpath,
        error,
      })
      throw new Error(`Error parsing document ${docpath}`, { cause: error })
    }
    parser.hash = objectHash([parser.docPathInProject])
    for (const key of LikeC4DocumentPropKeys) {
      try {
        if (!hasProp(doc, key) || key === 'likec4Parser') {
          continue
        }
        const value = key === 'c4Imports' ? doc.c4Imports.toJSON() : doc[key]
        parser.hash = objectHash([parser.hash, value])
      } catch (error) {
        this.#logger.warn({
          message: 'error hashing document property',
          project: project.id,
          doc: docpath,
          property: key,
          error,
        })
      }
    }
    doc.likec4Parser = parser
    return parser
  }
}
