import { argv } from 'node:process'

export function amIExecuted(filename: string) {
  return argv.some(arg => arg.includes(filename))
}
