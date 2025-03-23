import objecthash from 'object-hash'
import { isNonNullish } from 'remeda'
import { invariant } from '../errors'

export function objectHash(value: any): string {
  invariant(
    typeof value === 'object' && isNonNullish(value),
    'objectHash: value must be an object',
  )
  return objecthash(value, {
    ignoreUnknown: true,
    respectType: false,
  })
}
