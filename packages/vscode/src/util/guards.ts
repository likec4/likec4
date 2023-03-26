import { is, isNil } from 'rambdax'

export const isString = is(String)

export const isNotNullish = <T>(x: T): x is NonNullable<T> => !isNil(x)

export function expectNever(arg: never) {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unexpected value: ${arg}`);  
}
