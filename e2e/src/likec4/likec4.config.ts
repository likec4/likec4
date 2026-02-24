// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { defineConfig } from 'likec4/config'

export default defineConfig({
  name: 'e2e',
  implicitViews: false,
  imageAliases: {
    // '@' intentionally left blank to enable the 'default' to be picked up  as ./images
    '@root': '../root-level-images',
    '@nested': '../root-level-images/nested-1/nested-2',
  },
  aiChat: {
    baseUrl: 'https://mock-llm-api.test/v1',
    model: 'test-model',
    apiKey: 'sk-test-e2e-dummy-key',
    allowUnsafeApiKey: true,
    suggestedQuestions: {
      element: [
        'What is the purpose of {title}?',
        'How does {title} handle failures?',
      ],
    },
  },
})
