import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { path, project, useDotBin } from '../options'
import { publishHandler } from './handler'

/**
 * Registers the `publish` command with yargs.
 *
 * @param yargs - The yargs instance to attach the command to
 * @returns The configured yargs instance (chainable)
 */
export default function publishCmd(yargs: Argv) {
  return yargs.command({
    command: 'publish [path]',
    describe: 'publish model(s) to LikeC4 Cloud',
    builder: yargs =>
      yargs
        .positional('path', path)
        .options({
          'token': {
            string: true,
            desc: 'publish token (env: LIKEC4_PUBLISH_TOKEN)',
            nargs: 1,
          },
          'url': {
            string: true,
            desc: 'cloud base url (env: LIKEC4_CLOUD_URL, default https://likec4.app)',
            nargs: 1,
          },
          'project': {
            ...project,
            desc: 'publish a single project by name or path',
          },
          'origin': {
            string: true,
            desc: 'override "owner/repo" (default: derived from git remote origin)',
            nargs: 1,
          },
          'sha': {
            string: true,
            desc: 'override commit sha (default: git HEAD)',
            nargs: 1,
          },
          'branch': {
            string: true,
            desc: 'override branch (default: CI env, then git)',
            nargs: 1,
          },
          'tag': {
            string: true,
            desc: 'override tag (default: CI env, then git tag --points-at HEAD)',
            nargs: 1,
          },
          'force': {
            boolean: true,
            desc: 'publish even if the model has validation errors or an icon file cannot be read',
          },
          'use-dot': useDotBin,
        })
        .epilog(`${k.bold('Notes:')}
  ${k.gray('A snapshot is keyed by commit - publishing the same commit again')}
  ${k.gray('OVERWRITES its snapshot. Projects ACCUMULATE into a snapshot,')}
  ${k.gray('publishing one project never removes the others.')}

${k.bold('Examples:')}
  ${k.green('$0 publish --token=<token>')}
    ${k.gray('Publish all projects from the current directory')}

  ${k.green('$0 publish -p my-project ./src/likec4')}
    ${k.gray('Publish a single project into the snapshot of the current commit')}

  ${k.green('$0 publish --origin acme/architecture --sha $GIT_SHA')}
    ${k.gray('Publish without a git repository (both flags are required then)')}

  ${k.gray('# .github/workflows/likec4.yml')}
  ${k.gray('- uses: actions/checkout@v6')}
  ${k.gray('- run: npx likec4 publish')}
  ${k.gray('  env:')}
  ${k.gray('    LIKEC4_PUBLISH_TOKEN: ${{ secrets.LIKEC4_PUBLISH_TOKEN }}')}
    ${k.gray('Publish from GitHub Actions (branch and tag come from the workflow env)')}
`),
    handler: async args => {
      await publishHandler({
        path: args.path,
        token: args.token,
        url: args.url,
        project: args.project,
        origin: args.origin,
        sha: args.sha,
        branch: args.branch,
        tag: args.tag,
        force: !!args.force,
        useDotBin: !!args['use-dot'],
      })
    },
  })
}
