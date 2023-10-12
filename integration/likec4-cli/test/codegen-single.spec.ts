import { describe, it } from 'vitest'
import { $$, exists, readFile } from './utils'

describe('codegen', () => {
  it.concurrent('should generate react components', async ({ expect, task }) => {
    const outfile = `dist/${task.id}.tsx`
    await expect($$`yarn run likec4 codegen react -o ${outfile} likec4`).resolves.toBeTruthy()
    expect(exists(outfile)).toBe(true)
    expect(readFile(outfile)).toMatchSnapshot()
  })

  it.concurrent('should generate views-data', async ({ expect, task }) => {
    const outfile = `dist/${task.id}.ts`
    await expect($$`yarn run likec4 codegen views-data -o ${outfile} likec4`).resolves.toBeTruthy()
    expect(exists(outfile)).toBe(true)
    expect(readFile(outfile)).toMatchSnapshot()
  })

  it.concurrent('should generate ts', async ({ expect, task }) => {
    const outfile = `dist/${task.id}.ts`
    await expect($$`yarn run likec4 codegen ts -o ${outfile} likec4`).resolves.toBeTruthy()
    expect(exists(outfile)).toBe(true)
    expect(readFile(outfile)).toMatchSnapshot()
  })
})
