// @ts-nocheck

import 'zx/globals'

import { LikeC4 } from 'likec4'
import assert from 'node:assert'

echo(chalk.greenBright('\n-------- Generate React component --------'))
await $({ stdio: 'inherit' })`likec4 codegen react -o ./src/likec4-views.js ./src/likec4`

echo(chalk.greenBright('\n-------- Generate Model --------'))
await $({ stdio: 'inherit' })`likec4 codegen model -o ./src/likec4-model.ts ./src/likec4`

echo(chalk.greenBright('\n-------- Generate Tests --------'))

const likec4 = await LikeC4.fromWorkspace('src', {
  logger: 'default',
  throwIfInvalid: true,
})

assert.deepEqual(likec4.projects(), ['issue-2282', 'e2e'])

// Check e2e workspace
const computedModel = likec4.computedModel('e2e')
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

for (const view of views) {
  const project = view.$model.projectId
  const name = `${project}__${view.id}`
  const url = `/project/${encodeURIComponent(project)}/export/${encodeURIComponent(view.id)}/?padding=22`
  const content = `
import { test, expect } from "@playwright/test";

test('${project}/${view.id} - compare snapshots', async ({ page }) => {
  await page.setViewportSize({ width: ${view.$view.bounds.width + 40}, height: ${view.$view.bounds.height + 40} });
  await page.goto('${url}');
  await page.waitForSelector('.react-flow.initialized')
  await expect(page.getByTestId('export-page')).toHaveScreenshot('${name}.png', {
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
  await page.setViewportSize({ width: ${bounds.width + 40}, height: ${bounds.height + 40} });
  await page.goto('${url}&dynamic=sequence');
  await page.waitForSelector('.react-flow.initialized')
  await expect(page.getByTestId('export-page')).toHaveScreenshot('${name}-sequence.png', {
    animations: 'disabled',
    omitBackground: true,
  });
});
`
    await fs.writeFile(`tests/${name}-sequence-gen.spec.ts`, content, { encoding: 'utf-8' })
    echo(`Generated tests/${name}-sequence-gen.spec.ts`)
  }
}
