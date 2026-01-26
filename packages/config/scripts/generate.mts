import { writeFileSync } from 'node:fs'
import z from 'zod/v4'
import { LikeC4ProjectJsonConfigSchema } from '../src/schema'

const schema = z.toJSONSchema(LikeC4ProjectJsonConfigSchema, { io: 'input' })

writeFileSync(
  './schema.json',
  JSON.stringify(
    schema,
    null,
    2,
  ),
)

writeFileSync(
  '../../schemas/likec4-config.schema.json',
  JSON.stringify(
    schema,
    null,
    2,
  ),
)

console.log('JSON schema generated successfully')
