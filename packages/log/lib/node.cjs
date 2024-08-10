const lib = require('../dist/node.cjs')

module.exports = lib.consola

for (const key in lib) {
  if (!(key in module.exports)) {
    module.exports[key] = lib[key]
  }
}
