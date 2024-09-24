// @ts-nocheck

import 'zx/globals'

import { LikeC4 } from 'likec4'

echo(chalk.greenBright('\n-------- Generate React component --------'))
await $({ stdio: 'inherit' })`likec4 codegen react ./src`

echo(chalk.greenBright('\n-------- Generate Tests --------'))

const likec4 = await LikeC4.fromWorkspace('src/likec4', {
  logger: 'default',
  throwIfInvalid: true
})
const views = await likec4.diagrams()

const tests = views.map((view) => {
  return `
test('${view.id} - compare snapshots', async ({ page }) => {
  await page.goto('/export/${encodeURIComponent(view.id)}?padding=20');
  const diagramElement = page.getByRole('presentation')
  await diagramElement.waitFor()
  await expect(diagramElement).toHaveScreenshot('${view.id}.png', {
    omitBackground: true
  });
});
  `
})
// const stories = views.map((view) => {
//   return `
// export const ${capitalize(toCamelCase(view.id))}: Story = () => (
//   <LikeC4View viewId={${JSON.stringify(view.id)}} />
// )
//   `
// })

// const content = `
// import type { Story } from "@ladle/react";
// import { LikeC4View } from "./likec4-views";

// ${stories.join('')}
// `

// await fs.writeFile('src/likec4-views.stories.tsx', content, { encoding: 'utf-8' })

const content = `
import { test, expect } from "@playwright/test";

test.describe.configure({ mode: 'parallel' });

${tests.join('')}
`
await fs.writeFile('tests/snapshot.spec.ts', content, { encoding: 'utf-8' })
