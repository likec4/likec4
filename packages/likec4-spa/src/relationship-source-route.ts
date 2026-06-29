// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { ProjectId } from '@likec4/core/types'
import { loadModel } from 'likec4:model'
import { projects } from 'likec4:projects'
import { isWebappExportFormatEnabled } from './export-formats'
import {
  type RelationshipExportSearch,
  type RelationshipSourceExportFormat,
  generateRelationshipExportSource,
  normalizeRelationshipScope,
  renderRelationshipDotSvg,
} from './relationship-export'

function isRelationshipSourceExportEnabled(
  projectId: ProjectId,
  format: RelationshipSourceExportFormat,
): boolean {
  const project = projects.find(project => project.id === projectId)
  return !!project && isWebappExportFormatEnabled(project, format)
}

export async function loadRelationshipTextSource(
  format: Exclude<RelationshipSourceExportFormat, 'dot' | 'drawio'>,
  projectId: ProjectId,
  viewId: string,
  search: RelationshipExportSearch,
): Promise<string | null> {
  if (!search.relationships || !isRelationshipSourceExportEnabled(projectId, format)) {
    return null
  }
  const { $likec4model } = await loadModel(projectId)
  return await generateRelationshipExportSource(format, {
    model: $likec4model.get(),
    baseViewId: viewId as never,
    subjectId: search.relationships as never,
    scope: normalizeRelationshipScope(search.relationshipScope),
  })
}

export async function loadRelationshipDotSource(
  projectId: ProjectId,
  viewId: string,
  search: RelationshipExportSearch,
): Promise<{ dot: string; dotSvg: string } | null> {
  if (!search.relationships || !isRelationshipSourceExportEnabled(projectId, 'dot')) {
    return null
  }
  const { $likec4model } = await loadModel(projectId)
  const dot = await generateRelationshipExportSource('dot', {
    model: $likec4model.get(),
    baseViewId: viewId as never,
    subjectId: search.relationships as never,
    scope: normalizeRelationshipScope(search.relationshipScope),
  })
  return {
    dot,
    dotSvg: await renderRelationshipDotSvg(dot),
  }
}
