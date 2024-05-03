import type { Fqn, NodeId } from '@likec4/core'

const capitalizeFirstLetter = (value: string) => value.charAt(0).toLocaleUpperCase() + value.slice(1)

const capitalizeName = (name: string): string => name.split('.').map(capitalizeFirstLetter).join('')

export function normalizeFqn(fqn: Fqn): NodeId {
  return capitalizeName(fqn) as NodeId
}
