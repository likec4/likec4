// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

export const WebappExportFormats = ['png', 'jpg', 'dot', 'd2', 'mmd', 'puml', 'drawio'] as const

export type WebappExportFormat = typeof WebappExportFormats[number]
