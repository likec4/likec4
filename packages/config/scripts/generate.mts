import { writeFile } from 'node:fs/promises'
import * as z from 'zod'
import { LikeC4ProjectJsonConfigSchema } from '../src/schema'

await writeFile(
  './schema.json',
  JSON.stringify(
    z.toJSONSchema(LikeC4ProjectJsonConfigSchema, { io: 'input' }),
    null,
    2,
  ),
)

console.log('JSON schema generated successfully')
