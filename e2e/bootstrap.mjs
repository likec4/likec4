// @ts-nocheck

import 'zx/globals'

import { LikeC4 } from 'likec4'

echo(chalk.greenBright('\n-------- Generate React component --------'))
await $({ stdio: 'inherit' })`likec4 codegen react ./src`

echo(chalk.greenBright('\n-------- Generate Model --------'))
await $({ stdio: 'inherit' })`likec4 codegen model ./src`

echo(chalk.greenBright('\n-------- Generate Tests --------'))

const likec4 = await LikeC4.fromWorkspace('src/likec4', {
  logger: 'default',
  throwIfInvalid: true,
})
const computedModel = likec4.computedModel()
const computedViews = [...computedModel.views()].map(v => v.id)

const layoutedModel = await likec4.layoutedModel()
const layoutedViews = [...layoutedModel.views()].map(v => v.id)

if (computedViews.length !== layoutedViews.length) {
  throw new Error('Computed views and layouted views are not equal')
}

for (const view of layoutedModel.views()) {
  const content = `
import { test, expect } from "@playwright/test";

test('${view.id} - compare snapshots', async ({ page }) => {
  await page.setViewportSize({ width: ${view.$view.bounds.width + 40}, height: ${view.$view.bounds.height + 40} });
  await page.goto('/export/${encodeURIComponent(view.id)}?padding=20');
  await page.waitForSelector('.react-flow.initialized')
  await expect(page).toHaveScreenshot('${view.id}.png', {
    animations: 'disabled',
    omitBackground: true,
  });
});
`
  await fs.writeFile(`tests/${view.id}-gen.spec.ts`, content, { encoding: 'utf-8' })
  echo(`Generated tests/${view.id}-gen.spec.ts`)
}
