import type * as yargs from 'yargs'
import { checkAvailableUpdate } from './utils'

const checkUpdateCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'check-update',
      describe: 'Check for updates',
      handler: async () => {
        await checkAvailableUpdate()
      },
    })
}

export default checkUpdateCmd

export { notifyAvailableUpdate } from './utils'
