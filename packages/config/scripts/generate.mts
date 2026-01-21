import { writeFile } from 'node:fs/promises'
import z from 'zod/v4'
import { LikeC4ProjectJsonConfigSchema } from '../src/schema'

const schema = z.toJSONSchema(LikeC4ProjectJsonConfigSchema, { io: 'input' })

await writeFile(
  './schema.json',
  JSON.stringify(
    schema,
    null,
    2,
  ),
)

await writeFile(
  '../../schemas/likec4-config.schema.json',
  JSON.stringify(
    schema,
    null,
    2,
  ),
)

console.log('JSON schema generated successfully')
