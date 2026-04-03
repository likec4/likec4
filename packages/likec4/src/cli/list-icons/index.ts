import { iconGroups, iconRegistry } from '@likec4/language-server/icons'
import type { IconGroup } from '@likec4/language-server/icons'
import type * as yargs from 'yargs'

const listIconsCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'list-icons',
      describe: 'List available built-in icons',
      builder: yargs =>
        yargs
          .option('format', {
            alias: 'f',
            choices: ['text', 'json'] as const,
            default: 'text' as const,
            description: 'Output format',
          })
          .option('group', {
            alias: 'g',
            choices: iconGroups,
            description: 'Filter icons by group',
          }),
      handler: args => {
        const groups = args.group ? [args.group] as IconGroup[] : iconGroups

        switch (true) {
          case args.format === 'json': {
            const result = Object.fromEntries(
              groups.map(g => [g, iconRegistry[g]]),
            )
            console.log(JSON.stringify(result, null, 2))
            break
          }
          default: {
            for (const group of groups) {
              for (const name of iconRegistry[group]) {
                console.log(`${group}:${name}`)
              }
            }
          }
        }
      },
    })
}

export default listIconsCmd
