// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.
import { FqnRef, isSameHierarchy } from '@likec4/core';
import { AstUtils, DocumentState, WorkspaceCache } from 'langium';
import { flatMap, map, pipe } from 'remeda';
import { projectIdFrom, safeCall } from '../utils';
import { stringHash } from '../utils/stringHash';
import { tryOrLog } from './_shared';
export const relationChecks = (services) => {
    const modelParser = services.likec4.ModelParser;
    return tryOrLog((el, accept) => {
        const parser = modelParser.forDocument(AstUtils.getDocument(el));
        const source = safeCall(() => parser._resolveRelationSource(el));
        if (!source) {
            accept('error', 'Source not resolved', {
                node: el,
                property: 'source',
            });
            return;
        }
        const target = safeCall(() => parser.parseFqnRef(el.target));
        if (!target) {
            accept('error', 'Target not resolved', {
                node: el,
                property: 'target',
            });
            return;
        }
        if (FqnRef.isImportRef(source)) {
            if (FqnRef.isImportRef(target)) {
                accept('warning', 'Relationship between imported elements may not be visible in origin projects', {
                    node: el,
                });
            }
            else {
                accept('warning', 'Relationship from imported element to local element may not be visible in origin project', {
                    node: el,
                    property: 'source',
                });
            }
        }
        if (isSameHierarchy(FqnRef.flatten(source), FqnRef.flatten(target))) {
            accept('error', 'Invalid parent-child relationship', {
                node: el,
            });
        }
    });
};
export const checkRelationBody = (_services) => {
    return tryOrLog((body, accept) => {
        const relation = body.$container;
        if (relation.tags?.values && body.tags?.values) {
            accept('error', 'Relation cannot have tags in both header and body', {
                node: body.tags,
            });
        }
    });
};
export const extendRelationChecks = (services) => {
    const modelParser = services.likec4.ModelParser;
    const cache = new WorkspaceCache(services.shared, DocumentState.Linked);
    const calcFingerprint = ({ source, target, kind, title }) => stringHash('extend-relation', FqnRef.flatten(source), FqnRef.flatten(target), kind ?? 'default', title ?? '');
    function getProjectFingerprints(projectId) {
        return cache.get(projectId, () => new Set(pipe(services.shared.workspace.LangiumDocuments.projectDocuments(projectId).toArray(), flatMap(doc => doc.c4Relations ?? []), map(rel => calcFingerprint(rel)))));
    }
    return tryOrLog((el, accept) => {
        const doc = AstUtils.getDocument(el);
        const parser = modelParser.forDocument(doc);
        const source = safeCall(() => parser.parseFqnRef(el.source));
        if (!source) {
            accept('error', 'Source not resolved', {
                node: el,
                property: 'source',
            });
            return;
        }
        const target = safeCall(() => parser.parseFqnRef(el.target));
        if (!target) {
            accept('error', 'Target not resolved', {
                node: el,
                property: 'target',
            });
            return;
        }
        if (!FqnRef.isModelRef(source) && !FqnRef.isImportRef(source)) {
            accept('error', 'Source must reference a model element', {
                node: el,
                property: 'source',
            });
            return;
        }
        if (!FqnRef.isModelRef(target) && !FqnRef.isImportRef(target)) {
            accept('error', 'Target must reference a model element', {
                node: el,
                property: 'target',
            });
            return;
        }
        const projectId = projectIdFrom(doc);
        // Warn if this extend does not match any relation in the workspace
        // Build a match key identical to buildModel.ts
        const kind = (el.kind ?? el.dotKind?.kind)?.ref?.name ?? 'default';
        // Normalize title using the same parser helper
        const { title = '' } = parser.parseBaseProps({}, { title: el.title });
        const extendKey = calcFingerprint({ source, target, kind, title });
        const hasMatch = getProjectFingerprints(projectId).has(extendKey);
        if (!hasMatch) {
            accept('warning', 'This extend does not match any relation (by source, kind, target, title)', {
                node: el,
            });
        }
    });
};
