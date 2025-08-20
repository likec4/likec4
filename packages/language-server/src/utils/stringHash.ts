import { stringHash as hash } from '@likec4/core/utils'

export function stringHash(...str: [string, ...string[]]): string {
  var s = str.length > 1 ? str.join(':::') : str[0]
  return hash(s)
}
