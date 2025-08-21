import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { LikeC4 } from '../../LikeC4'
import { boxen } from '../../logger'
import { path, useDotBin } from '../options'

const mcpCmd = <T>(yargs: Argv<T>) => {
  return yargs
    .command({
      command: 'mcp [path]',
      aliases: [],
      describe: 'Start MCP server',
      builder: y =>
        y
          .usage(`${k.bold('Usage:')} $0 mcp [path]`)
          .positional('path', path)
          .option('stdio', {
            boolean: true,
            description: 'use stdio transport',
            conflicts: ['http', 'port'],
          })
          .option('http', {
            boolean: true,
            description: 'use streamable http transport (use 33335 port by default)',
            conflicts: 'stdio',
          })
          .option('port', {
            alias: 'p',
            number: true,
            description: 'enables http transport and sets the port',
            conflicts: 'stdio',
          })
          .option('use-dot', useDotBin)
          .epilog(`${k.bold('Examples:')}
${k.green('$0 mcp')}
  ${k.gray('Start MCP with default stdio transport')}
${k.green('$0 mcp --http ./src')}
  ${k.gray('Start MCP with streamable http transport on port 33335 at ./src folder')}
${k.green('$0 mcp -p 1234')}
  ${k.gray('Start MCP with streamable http transport on port 1234')}
`),
      handler: async args => {
        if (args.http || args.port) {
          await startHttpMcp(args.path, args.useDot, args.port)
        } else {
          await startStdioMcp(args.path, args.useDot)
        }
      },
    })
}

async function startHttpMcp(path: string, useDotBin: boolean, port = 33335) {
  await LikeC4.fromWorkspace(path, {
    mcp: { port },
    watch: true,
    graphviz: useDotBin ? 'binary' : 'wasm',
  })
  boxen(
    [
      k.green('LikeC4 MCP served at:'),
      `
{
  "mcpServers": {
    "likec4": {
      "url": "http://localhost:${port}/mcp"
    }
  }
}      

${k.dim('Documentation:')}
${k.underline('https://likec4.dev/tooling/mcp/#using-extension')}
`,
    ].join('\n'),
  )
}

async function startStdioMcp(path: string, useDotBin: boolean) {
  await LikeC4.fromWorkspace(path, {
    mcp: 'stdio',
    watch: true,
    graphviz: useDotBin ? 'binary' : 'wasm',
  })
}

export default mcpCmd
