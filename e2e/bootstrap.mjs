// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

// @ts-nocheck

import 'zx/globals'
import { LikeC4 } from 'likec4'
import assert from 'node:assert'

$.stdio = 'inherit'
$.verbose = true

echo(chalk.greenBright('\n-------- Generate React component --------'))
await $`likec4 codegen react -o ./src/likec4-views.js ./src/likec4`

echo(chalk.greenBright('\n-------- Generate Model --------'))
await $`likec4 codegen model -o ./src/likec4-model.ts ./src/likec4`

echo(chalk.greenBright('\n-------- Generate Tests --------'))

const likec4 = await LikeC4.fromWorkspace('src', {
  logger: 'default',
  throwIfInvalid: true,
})

assert.deepEqual(likec4.projects().sort(), ['e2e', 'export-config', 'export-disabled', 'issue-2282', 'note-placement'])

// Check e2e workspace
const computedModel = likec4.syncComputedModel('e2e')
const computedViews = [...computedModel.views()].map(v => v.id)

const layoutedModel_e2e = await likec4.layoutedModel('e2e')
if (computedViews.length !== [...layoutedModel_e2e.views()].length) {
  throw new Error('Computed views and layouted views are not equal')
}

const layoutedModel_issue_2282 = await likec4.layoutedModel('issue-2282')

const views = [
  ...layoutedModel_e2e.views(),
  ...layoutedModel_issue_2282.views(),
]
const extraViewportPadding = 20
const viewportPadding = 40 + extraViewportPadding

for (const view of views) {
  const project = view.$model.projectId
  const name = `${project}__${view.id}`
  const url = `/project/${encodeURIComponent(project)}/export/${encodeURIComponent(view.id)}/?padding=22`
  // This fixture needs the same deterministic image response as the focused loading test.
  const imageRoute = project === 'e2e' && view.id === 'note-cards-delayed-image'
    ? `await page.route('https://example.invalid/likec4-note.svg', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" fill="#d3b45a"/><text x="60" y="34" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#362f1c">SVG TEST IMAGE</text></svg>',
  }));`
    : ''
  const settleExport = `const exportPage = page.getByTestId('export-page');
  await expect(exportPage).toHaveAttribute('data-likec4-export-ready', 'true');
  const exportBounds = await exportPage.boundingBox();
  if (!exportBounds) throw new Error('Export page has no measured bounds');
  await page.setViewportSize({ width: Math.ceil(exportBounds.width), height: Math.ceil(exportBounds.height) });
  await expect(exportPage).toHaveAttribute('data-likec4-export-ready', 'true');`
  const content = `
import { test, expect } from "@playwright/test";

test('${project}/${view.id} - compare snapshots', async ({ page }) => {
  await page.setViewportSize({ width: ${view.$view.bounds.width + viewportPadding}, height: ${
    view.$view.bounds.height + viewportPadding
  } });
  ${imageRoute}
  await page.goto('${url}');
  ${settleExport}
  await expect(exportPage).toHaveScreenshot('${name}.png', {
    animations: 'disabled',
    omitBackground: true,
  });
});
`
  await fs.writeFile(`tests/${name}-gen.spec.ts`, content, { encoding: 'utf-8' })
  echo(`Generated tests/${name}-gen.spec.ts`)

  if (view.isDynamicView()) {
    const { bounds } = view.$view.sequenceLayout
    const content = `
import { test, expect } from "@playwright/test";

test('${project}/${view.id} - sequence - compare snapshots', async ({ page }) => {
  await page.setViewportSize({ width: ${bounds.width + viewportPadding}, height: ${bounds.height + viewportPadding} });
  await page.goto('${url}&dynamic=sequence');
  ${settleExport}
  await expect(exportPage).toHaveScreenshot('${name}-sequence.png', {
    animations: 'disabled',
    omitBackground: true,
    timeout: 15_000,
  });
});
`
    await fs.writeFile(`tests/${name}-sequence-gen.spec.ts`, content, { encoding: 'utf-8' })
    echo(`Generated tests/${name}-sequence-gen.spec.ts`)
  }
}
