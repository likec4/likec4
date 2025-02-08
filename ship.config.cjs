module.exports = {
  monorepo: {
    updateDependencies: false,
    mainVersionFile: 'package.json', // or `lerna.json`, or whatever a json file you can read the latest `version` from.
    packagesToBump: [
      'packages/*',
      'apps/*'
    ],
    packagesToPublish: [
      'packages/core',
      'packages/log',
      'packages/icons',
      'packages/diagram',
      'packages/language-server',
      'packages/layouts',
      'packages/likec4'
    ]
  },
  publishCommand: ({ tag }) => `yarn npm publish --tag ${tag} --access public --tolerate-republish`
}
