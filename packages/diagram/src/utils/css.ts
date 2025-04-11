export function getVarName(variable: string): string {
  var matches = variable.match(/^var\((.*)\)$/)
  if (matches) {
    return matches[1]!
  }
  return variable
}
