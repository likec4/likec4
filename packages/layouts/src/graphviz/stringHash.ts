import hash from 'string-hash'

export function stringHash(...str: [string, ...string[]]): string {
  var s = str.length > 1 ? str.join(':::') : str[0]
  return hash(s).toString(36)
}
