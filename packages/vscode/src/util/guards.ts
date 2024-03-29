export { isNonNullish, isString } from 'remeda'

export function expectNever(arg: never) {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unexpected value: ${arg}`)
}
