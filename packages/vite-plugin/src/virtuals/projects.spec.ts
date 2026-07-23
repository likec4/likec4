// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, it } from 'vitest'
import { generateCombinedProjects } from './_shared'
import { projectsModule } from './projects'

describe('projects virtual module export capabilities', () => {
  it('publishes effective export formats for every project', async ({ expect }) => {
    const result = await projectsModule.load.call({} as any, {
      projects: [
        {
          id: 'all',
          title: undefined,
          config: {},
        },
        {
          id: 'configured',
          title: 'Configured',
          config: {
            webapp: {
              exportFormats: ['drawio', 'jpg', 'dot'],
            },
          },
        },
      ],
    } as any)

    expect(result).toMatchObject({
      moduleType: 'js',
    })
    const code = typeof result === 'string' ? result : result.code
    expect(code).toContain('exportFormats: [\n      \'png\',')
    expect(code).toContain('id: \'configured\'')
    expect(code).toContain('exportFormats: [\n      \'jpg\',\n      \'dot\',\n      \'drawio\'')
  })

  it('generates combined export modules only for projects that enable the format', async ({ expect }) => {
    const mod = generateCombinedProjects('dot', 'loadDotSources', 'dot')
    const result = await mod.load.call({} as any, {
      projects: [
        {
          id: 'exports-dot',
          config: {
            webapp: {
              exportFormats: ['dot'],
            },
          },
        },
        {
          id: 'without-dot',
          config: {
            webapp: {
              exportFormats: ['png'],
            },
          },
        },
      ],
    } as any)

    const code = typeof result === 'string' ? result : result.code
    expect(code).toContain('exports-dot')
    expect(code).not.toContain('without-dot')
    expect(code).toContain('throw new Error("Project does not enable dot export: " + projectId)')
    expect(code).not.toContain('Falling back to project')
    expect(code).toContain('loadDotSourcesFn = update')
    expect(code).not.toContain('??=')
  })
})
