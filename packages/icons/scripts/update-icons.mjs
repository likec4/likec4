import { fdir } from 'fdir'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import * as path from 'path'
import { $ } from 'zx'

$.stdio = 'inherit'
$.preferLocal = true

process.on('unhandledRejection', (err) => {
  console.error(err)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  console.error(err)
  process.exit(1)
})

console.info('Cleaning up...')
await rm('.tmp/src', { force: true, recursive: true })
await mkdir('.tmp/src', { recursive: true })

// -----------------------------------------------------------
// ------------------------ tech ----------------------------

if (!existsSync('.tmp/tech.zip')) {
  console.info('Fetching tech-icons...')
  await $`curl -o .tmp/tech.zip https://icon.icepanel.io/Technology/svg.zip`
}
await $`unzip .tmp/tech.zip -d .tmp/src/tech`
const techRenames = {
  'Apache-Tomcat': 'tomcat',
  'Apache-Subversion': 'subversion',
  'Apache-Spark': 'spark',
  'Apache-Maven': 'maven',
  'Apache-Kafka': 'kafka',
  'Apache-Hadoop': 'hadoop',
  'Apache-Groovy': 'groovy',
  'Apache-Cassandra': 'cassandra',
  'Apache-Airflow': 'airflow',
  'Arch-Linux': 'archlinux',
  'Argo-CD': 'argocd',
  'Alpine.js': 'alpinejs',
  'Adobe-Commerce-(Magneto)': 'magento',
  'AWS': 'amazon-web-services',
  'Internet-Explorer-10-(ie10)': 'ie10',
  'Elastic-Search': 'elasticsearch',
  'Elastic-Beats': 'elasticbeats',
  'BrowserStack': 'browserstack',
  'BitBucket': 'bitbucket',
  'GitLab': 'gitlab',
  'GitHub': 'github',
  'GitBook': 'gitbook',
  'Red-Hat': 'redhat',
  'Raspberry-Pi': 'raspberrypi',
  'PyTorch': 'pytorch',
  'PyScript': 'pyscript',
  'PyCharm': 'pycharm',
  'PureScript': 'purescript',
  'PostCSS': 'postcss',
  'NuGet': 'nuget',
  'NixOS': 'nix',
  'Next.js': 'nextjs',
  'Nest.js': 'nestjs',
  'Grunt.js': 'gruntjs',
  'Gulp.js': 'gulpjs',
  'MongoDB': 'mongodb',
  'InfluxDB': 'influxdb',
  'LinkedIn': 'linkedin',
  'JetBrains': 'jetbrains',
  'JavaScript': 'javascript',
  'Jaeger-Tracing': 'jaeger',
  'Jira': 'jira',
  'PuTTY': 'putty',
  'GitHub-Codespaces': 'github-codespaces',
  'GitHub-Actions': 'github-actions',
  'HashiCorp-Vault': 'hashicorp-vault',
  'HashiCorp-Vagrant': 'vagrant',
  'HashiCorp-Terraform': 'terraform',
  'Node.js': 'nodejs',
  'Vite.js': 'vitejs',
  'IntelliJ-IDEA': 'intellij-idea',
  'Protractor-Test': 'protractor',
  'JUnit': 'junit',
  'JQuery': 'jquery',
  'TensorFlow': 'tensorflow',
  'TypeScript': 'typescript',
  'TeX': 'tex',
  'Unified-Modelling-Language-(UML)': 'uml',
  'NW.js-(node-webkit)': 'nodewebkit',
  'GraphQL': 'graphql',
  'RocksDB': 'rocksdb',
  'RaspberryPi': 'raspberry-pi',
  'Rollup.js': 'rollupjs',
  'PostgresSQL': 'postgresql',
  'RabbitMQ': 'rabbitmq',
  'Solid.js': 'solidjs',
  'Stack-Overflow': 'stackoverflow',
  'Simple-DirectMedia-Layer-(SDL)': 'sdl',
  'SonarQube': 'sonarqube',
  'Qt-Framework': 'qt',
  'FSharp-(F#)': 'fsharp',
  'D3.js': 'd3js',
  'C#-(CSharp)': 'csharp',
  'C++-(CPlusPlus)': 'cplusplus',
  'Cosmos-BD': 'cosmosdb',
  'CouchDB': 'couchdb',
  'Core-js': 'vorejs',
  'LaTeX': 'latex',
  'MySQL': 'mysql',
  'ESLint': 'eslint',
  'DBeaver': 'dbeaver',
  'uWSGI': 'uwsgi',
  'p5-JS': 'p5js',
  'LLVM': 'llvm',
  'Karate-Labs': 'karate',
  'LabVIEW': 'labview',
  'Tailwind-CSS': 'tailwindcss',
  'Three.js': 'threejs',
  'Unreal-Engine': 'unrealengine',
  'SQLite': 'sqlite',
  'Vue.js': 'vue',
  'vSphere': 'vsphere',
  'Visual-Studio-Code-(VS-Code)': 'vscode',
  'Visual-Studio': 'visual-studio',
  'WebAssembly': 'webassembly',
  'WebStorm': 'webstorm',
  'WordPress': 'wordpress',
  'Windows-8': 'windows8',
  'Windows-11': 'windows11',
}
for (const [oldName, newName] of Object.entries(techRenames)) {
  await $`mv .tmp/src/tech/${oldName}.svg .tmp/src/tech/${newName}.svg`
}
console.info('tech-icons - OK')

// -----------------------------------------------------------
// ------------------------ gcp ----------------------------

if (!existsSync('.tmp/gcp.zip')) {
  console.info('Fetching gcp-icons...')
  await $`curl -o .tmp/gcp.zip https://icon.icepanel.io/GCP/svg.zip`
}
await rm('.tmp/gcp', { force: true, recursive: true })
await $`unzip .tmp/gcp.zip  -d .tmp/gcp`
await $`mv .tmp/gcp/svg .tmp/src/gcp`
console.info('gcp-icons - OK')

// -----------------------------------------------------------
// ------------------------ aws ----------------------------

if (!existsSync('.tmp/aws.zip')) {
  console.info('Fetching aws-icons...')
  await $`curl -o .tmp/aws.zip https://icon.icepanel.io/AWS/svg.zip`
}
await rm('.tmp/aws', { force: true, recursive: true })
await $`unzip .tmp/aws.zip -d .tmp/aws`
await mkdir('.tmp/src/aws', { recursive: true })

const awsSvgs = new fdir().glob('**/*.svg').withFullPaths().crawl('.tmp/aws').sync()
for (const svg of awsSvgs) {
  const name = path.basename(svg)
  await $`mv ${svg} .tmp/src/aws/${name}`
}
console.info('aws-icons - OK')

// -----------------------------------------------------------
// ------------------------ azure ----------------------------

if (!existsSync('.tmp/azure.zip')) {
  console.info('Fetching azure-icons...')
  await $`curl -o .tmp/azure.zip https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V22.zip`
}
await rm('.tmp/azure', { force: true, recursive: true })
await $`unzip .tmp/azure.zip  -d .tmp/azure`
await mkdir('.tmp/src/azure', { recursive: true })

const azureSvgs = new fdir().glob('**/*.svg').withFullPaths().crawl('.tmp/azure').sync()
for (const svg of azureSvgs) {
  // The \s* is due to some filenames having a space included after the digits.
  // e.g. in v22 /new-icons/030777508 -icon-service-Service-Group-Relationships.svg
  let name = path.basename(svg).replace(/^\d+\s*-icon-service-/, '')
  name = path.resolve('.tmp/src/azure', name)
  await $`mv ${path.resolve(svg)} ${name}`
}

const azureRenames = {
  'Multi-Factor-Authentication': 'Identity-Multi-Factor-Authentication',
}
for (const [oldName, newName] of Object.entries(azureRenames)) {
  await $`mv .tmp/src/azure/${oldName}.svg .tmp/src/azure/${newName}.svg`
}
console.info('azure-icons - OK')

// -----------------------------------------------------------
// ------------------------ svg-logos ------------------------

await rm('.tmp/svg-logos', { force: true, recursive: true })
if (!existsSync('.tmp/logos.zip')) {
  console.info('Fetching svg-logos...')
  await $`curl -o .tmp/logos.zip https://codeload.github.com/gilbarbara/logos/zip/refs/heads/main`
}
await $`unzip .tmp/logos.zip  -d .tmp/svg-logos`
// Remove semantic-web.svg due to its failure to convert properly
await rm('.tmp/svg-logos/logos-main/logos/semantic-web.svg', { force: true, recursive: true })
const logoRenames = {
  'html-5': 'html5',
  'c-plusplus': 'cplusplus',
  'c-sharp': 'csharp',
  'css-3': 'css3',
  'css-3_official': 'css3-official',
}
for (const [oldName, newName] of Object.entries(logoRenames)) {
  try {
    await $`mv .tmp/svg-logos/logos-main/logos/${oldName}.svg .tmp/svg-logos/logos-main/logos/${newName}.svg`
  } catch (e) {
    console.warn(`Failed to rename logo ${oldName} to ${newName}: ${e}`)
  }
}
// Remove AWS logos from svg-logos as we have a dedicated aws-icons set
const awslogos = new fdir().glob('aws-*.svg').withFullPaths().crawl('.tmp/svg-logos/logos-main/logos').sync()
for (const svg of awslogos) {
  await rm(svg, { force: true, recursive: true })
}

// Copy all logos to src/tech, as they are all technology logos
await $`cp .tmp/svg-logos/logos-main/logos/* .tmp/src/tech`

console.info('svg-logos - OK')

// ------------------------ Generate React components ------------------------

await $`rm -r -f ${['aws', 'azure', 'gcp', 'tech']}`

console.info('generating svg...')
const opts = [
  '--filename-case',
  'kebab',
  '--typescript',
  '--jsx-runtime',
  'automatic',
  '--svgo-config',
  'svgo.config.json',
]

await $`pnpx @svgr/cli ${opts} --out-dir . -- .tmp/src`
console.info('generated svg - DONE')

await $`rm -r -f .tmp/src .tmp/aws .tmp/azure .tmp/gcp .tmp/svg-logos`
console.info('Cleaning up temp files - DONE')

for (const fname of new fdir().glob('**/*.tsx').withFullPaths().crawl().sync()) {
  const input = readFileSync(fname, 'utf-8')

  const output = `// @ts-nocheck \n\n` + input
  await writeFile(fname, output)
}

console.info('Formatting...')
await $`dprint fmt ${'./**/*.{tsx,ts}'}`

console.info('DONE')
