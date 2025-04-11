module.exports = {
  monorepo: {
    updateDependencies: false,
    mainVersionFile: 'package.json', // or `lerna.json`, or whatever a json file you can read the latest `version` from.
    packagesToBump: [
      'packages/*',
      'apps/*',
      'styled-system/*',
    ],
    packagesToPublish: [
      'packages/core',
      'packages/icons',
      'packages/diagram',
      'packages/language-server',
      'packages/likec4',
      'styled-system/preset',
      'styled-system/styles',
    ],
  },
  installCommand: () => 'pnpm install',
  buildCommand: () => 'pnpm build',
  publishCommand: ({ tag }) => `pnpm publish --tag ${tag} --access public`,
}
