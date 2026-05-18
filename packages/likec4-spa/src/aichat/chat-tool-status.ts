// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

const toolLabels: Record<string, string> = {
  navigate_to: 'Opening view',
  read_ui: 'Reading diagram state',
  update_ui: 'Updating diagram',
}

export function formatToolActivityLabel(toolName: string): string {
  return `${toolLabels[toolName] ?? `Running ${toolName}`}...`
}
