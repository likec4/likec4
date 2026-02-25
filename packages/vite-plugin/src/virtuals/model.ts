// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { LikeC4Model } from '@likec4/core/model'
import JSON5 from 'json5'
import { type ProjectVirtualModule, generateCombinedProjects, generateMatches, k } from './_shared'

/**
 * Strip sensitive fields (like API keys) from the model data before serialization.
 * The serialized data ends up in client-side JS bundles, so secrets must not be included
 * unless the user explicitly opts in with `allowUnsafeApiKey: true`.
 */
function sanitizeModelData(data: LikeC4Model.Layouted['$data']): LikeC4Model.Layouted['$data'] {
  if (!data.project.aiChat) {
    return data
  }
  const { enabled, baseUrl, model, apiKey, allowUnsafeApiKey, suggestedQuestions, systemPrompt } = data.project.aiChat
  return {
    ...data,
    project: {
      ...data.project,
      aiChat: {
        ...(enabled !== undefined && { enabled }),
        ...(baseUrl !== undefined && { baseUrl }),
        ...(model !== undefined && { model }),
        // Only include apiKey when the user explicitly opts in
        ...(allowUnsafeApiKey && { apiKey }),
        ...(suggestedQuestions !== undefined && { suggestedQuestions }),
        ...(systemPrompt !== undefined && { systemPrompt }),
      },
    },
  }
}

const projectModelCode = (model: LikeC4Model.Layouted) => `
import { createHooksForModel, atom } from 'likec4/vite-plugin/internal'

export const $likec4data = atom(${JSON5.stringify(sanitizeModelData(model.$data))})

export const {
  updateModel,
  $likec4model,
  useLikeC4Model,
  useLikeC4Views,
  useLikeC4View
} = createHooksForModel($likec4data)

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    if (!import.meta.hot.data.$update) {
      import.meta.hot.data.$update = updateModel
    }
    const update = md.$likec4data?.get()
    if (update) {
      import.meta.hot.data.$update(update)
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`

export const projectModelModule = {
  ...generateMatches('model'),
  async load({ likec4, project, logger }) {
    logger.info(k.dim(`generating likec4:model/${project.id}`))
    const model = await likec4.layoutedModel(project.id)
    return projectModelCode(model)
  },
} satisfies ProjectVirtualModule

export const modelModule = generateCombinedProjects('model', 'loadModel')
