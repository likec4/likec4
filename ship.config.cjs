module.exports = {
  monorepo: {
    updateDependencies: false,
    mainVersionFile: 'package.json', // or `lerna.json`, or whatever a json file you can read the latest `version` from.
    packagesToBump: ['packages/*', 'docs', 'examples/*'],
    packagesToPublish: [
      'packages/core',
      'packages/diagrams',
      'packages/graph',
      'packages/generators',
      'packages/language-server',
      'packages/layouts',
      'packages/create-likec4',
      'packages/likec4',
    ]
  },
  publishCommand: ({ tag }) => `yarn npm publish --tag ${tag} --access public`
}
