module.exports = {
  monorepo: {
    mainVersionFile: 'package.json', // or `lerna.json`, or whatever a json file you can read the latest `version` from.
    packagesToBump: ['packages/*', 'docs', 'examples/*'],
    packagesToPublish: [
      'packages/core',
      'packages/cli',
      'packages/diagrams',
      'packages/generators',
      'packages/language-server',
      'packages/layouts'
    ]
  },
  updateChangelog: false,
  afterPublish: ({ exec }) => {
    exec('git checkout main');
    exec('git merge develop');
    exec('git push origin main');
    exec('git checkout develop');
  },
  publishCommand: ({ defaultCommand }) => `${defaultCommand} --access public`
}
