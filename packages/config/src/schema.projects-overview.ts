// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { ThemeColors } from '@likec4/core/styles'
import z from 'zod/v4'

export type ProjectsOverviewGroupBy = {
  key: string
  colors?: Record<string, (typeof ThemeColors)[number]> | undefined
  thenBy?: ProjectsOverviewGroupBy | undefined
}

const GroupBySchema: z.ZodType<ProjectsOverviewGroupBy> = z.lazy(() =>
  z.strictObject({
    key: z.string().trim().nonempty('groupBy key cannot be empty'),
    colors: z.record(z.string().trim().nonempty('color value cannot be empty'), z.enum(ThemeColors)).optional(),
    thenBy: GroupBySchema.optional(),
  })
)

function repeatedGroupKey(groupBy: ProjectsOverviewGroupBy): string | null {
  const seen = new Set<string>()
  let current: ProjectsOverviewGroupBy | undefined = groupBy
  while (current) {
    if (seen.has(current.key)) {
      return current.key
    }
    seen.add(current.key)
    current = current.thenBy
  }
  return null
}

function firstDuplicate(values: readonly string[]): string | null {
  const seen = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) {
      return value
    }
    seen.add(value)
  }
  return null
}

export const ProjectsOverviewSchema = z.strictObject({
  exclude: z.strictObject({
    key: z.string().trim().nonempty('exclude key cannot be empty'),
    values: z.array(z.string().trim().nonempty('exclude value cannot be empty')).min(
      1,
      'exclude needs at least one value',
    ),
  }).optional(),
  groupBy: GroupBySchema.optional(),
  order: z.array(z.string().trim().nonempty('order value cannot be empty')).optional(),
  colorBy: z.strictObject({
    key: z.string().trim().nonempty('colorBy key cannot be empty'),
    colors: z.record(z.string().trim().nonempty('color value cannot be empty'), z.enum(ThemeColors)),
  }).optional(),
  routing: z.enum(['spline', 'ortho']).optional(),
}).superRefine((overview, ctx) => {
  if (overview.groupBy) {
    const repeated = repeatedGroupKey(overview.groupBy)
    if (repeated) {
      ctx.addIssue({
        code: 'custom',
        message: `groupBy key "${repeated}" is repeated`,
        path: ['groupBy'],
      })
    }
  }
  if (overview.order && !overview.groupBy) {
    ctx.addIssue({
      code: 'custom',
      message: 'order needs groupBy',
      path: ['order'],
    })
  }
  if (overview.order) {
    const duplicate = firstDuplicate(overview.order)
    if (duplicate !== null) {
      ctx.addIssue({
        code: 'custom',
        message: `order value "${duplicate}" is repeated`,
        path: ['order'],
      })
    }
  }
}).meta({
  id: 'ProjectsOverviewConfig',
  description: 'Hide, group, color and route the projects overview. Omitted settings keep the generated overview.',
})

export type ProjectsOverviewConfig = z.infer<typeof ProjectsOverviewSchema>
