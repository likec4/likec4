// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.
import { DefaultWeakMap, invariant, MultiMap } from '@likec4/core/utils';
import { DocumentState, UriUtils } from 'langium';
import { pipe } from 'remeda';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { isLikeC4LangiumDocument } from '../ast';
import { logger as rootLogger, logWarnError } from '../logger';
import { BaseParser } from './parser/Base';
import { DeploymentModelParser } from './parser/DeploymentModelParser';
import { DeploymentViewParser } from './parser/DeploymentViewParser';
import { ExpressionV2Parser } from './parser/FqnRefParser';
import { GlobalsParser } from './parser/GlobalsParser';
import { ImportsParser } from './parser/ImportsParser';
import { ModelParser } from './parser/ModelParser';
import { PredicatesParser } from './parser/PredicatesParser';
import { SpecificationParser } from './parser/SpecificationParser';
import { ViewsParser } from './parser/ViewsParser';
const DocumentParserFromMixins = pipe(BaseParser, ExpressionV2Parser, ImportsParser, ModelParser, DeploymentModelParser, DeploymentViewParser, PredicatesParser, SpecificationParser, ViewsParser, GlobalsParser);
export class DocumentParser extends DocumentParserFromMixins {
}
const logger = rootLogger.getChild('parser');
const isError = (d) => d.severity === DiagnosticSeverity.Error;
export class LikeC4ModelParser {
    services;
    cachedParsers = new DefaultWeakMap((doc) => this.createParser(doc));
    constructor(services) {
        this.services = services;
        services.shared.workspace.DocumentBuilder.onDocumentPhase(DocumentState.Linked, async (doc) => {
            if (this.cachedParsers.has(doc)) {
                logger.trace('Linked: clear cached parser {projectId} document {doc}', {
                    projectId: doc.likec4ProjectId,
                    doc: UriUtils.basename(doc.uri),
                });
                this.cachedParsers.delete(doc);
            }
        });
        services.shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Linked, async (docs) => {
            for (const doc of docs) {
                if (services.shared.workspace.ProjectsManager.isExcluded(doc)) {
                    continue;
                }
                try {
                    // Force create parser for linked document (if not yet created)
                    this.parse(doc);
                }
                catch (error) {
                    logWarnError(error);
                }
            }
        });
        // We need to clean up cached parser when document is validated and has errors
        // Because after that parser takes into account validation results
        services.shared.workspace.DocumentBuilder.onDocumentPhase(DocumentState.Validated, async (doc) => {
            if (doc.diagnostics?.some(isError) && this.cachedParsers.has(doc)) {
                logger.trace('Validated: clear cached parser {projectId} document {doc} because of errors', {
                    projectId: doc.likec4ProjectId,
                    doc: UriUtils.basename(doc.uri),
                });
                this.cachedParsers.delete(doc);
            }
        });
    }
    documents(projectId) {
        return this.services.shared.workspace.LangiumDocuments.projectDocuments(projectId).map(d => this.parse(d));
    }
    parse(doc) {
        const parser = this.forDocument(doc);
        return parser.doc;
    }
    forDocument(doc) {
        return this.cachedParsers.get(doc);
    }
    createParser(doc) {
        invariant(isLikeC4LangiumDocument(doc), `Document ${doc.uri.toString()} is not a LikeC4 document`);
        const project = this.services.shared.workspace.ProjectsManager.getProject(doc);
        const docpath = UriUtils.relative(project.folderUri, doc.uri);
        if (doc.likec4ProjectId) {
            logger.trace(`create parser {projectId} document {doc}`, {
                projectId: doc.likec4ProjectId,
                doc: docpath,
            });
        }
        else {
            logger.warn(`create parser for document without project {doc}`, { doc: doc.uri.fsPath });
        }
        if (doc.state < DocumentState.Linked) {
            logger.warn(`Document {doc} is not linked, state is {state}`, {
                doc: docpath,
                state: doc.state,
            });
        }
        const props = {
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
        };
        doc = Object.assign(doc, props);
        const parser = new DocumentParser(this.services, doc, project);
        try {
            parser.parseSpecification();
            parser.parseImports();
            parser.parseModel();
            parser.parseDeployment();
            parser.parseGlobals();
            parser.parseViews();
        }
        catch (error) {
            throw new Error(`Error parsing document ${docpath}`, { cause: error });
        }
        return parser;
    }
}
