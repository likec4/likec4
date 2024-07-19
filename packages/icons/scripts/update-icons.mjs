import consola from 'consola'
import { $ } from 'execa'
import { glob, globSync } from 'glob'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'

await rm('.tmp/src', { force: true, recursive: true })
await mkdir('.tmp/src', { recursive: true })

if (!existsSync('.tmp/tech.zip')) {
  consola.info('Fetching tech-icons...')
  await $`curl -o .tmp/tech.zip  https://icon.icepanel.io/Technology/svg.zip`
}
await $`unzip .tmp/tech.zip -d .tmp/src/tech`
const renames = {
  'Apache-Tomcat': 'Tomcat',
  'Apache-Subversion': 'Subversion',
  'Apache-Spark': 'Spark',
  'Apache-Maven': 'Maven',
  'Apache-Kafka': 'Kafka',
  'Apache-Hadoop': 'Hadoop',
  'Apache-Groovy': 'Groovy',
  'Apache-Cassandra': 'Cassandra',
  'Apache-Airflow': 'Airflow',
  'AWS': 'AmazonWebServices',
  'Internet-Explorer-10-(ie10)': 'ie10',
  'Elastic-Search': 'Elasticsearch',
  'Elastic-Beats': 'Elasticbeats',
  'BrowserStack': 'Browserstack-',
  'BitBucket': 'Bitbucket-',
  'GitLab': 'Gitlab-',
  'GitHub': 'Github-',
  'Red-Hat': 'Redhat',
  'Raspberry-Pi': 'Raspberrypi',
  'PyTorch': 'Pytorch-',
  'PyScript': 'Pyscript-',
  'PyCharm': 'Pycharm-',
  'PureScript': 'Purescript-',
  'PostCSS': 'Postcss-',
  'NuGet': 'Nuget-',
  'NixOS': 'Nix',
  'Next.js': 'Nextjs',
  'Nest.js': 'Nestjs',
  'MongoDB': 'Mongodb-',
  'InfluxDB': 'Influxdb-',
  'LinkedIn': 'Linkedin-',
  'JetBrains': 'Jetbrains-',
  'JavaScript': 'Javascript-',
  'Jaeger-Tracing': 'Jaeger-',
  'PuTTY': 'Putty-',
  'GitHub-Codespaces': 'GithubCodespaces',
  'GitHub-Actions': 'GithubActions',
  'HashiCorp-Vault': 'HashicorpVault',
  'HashiCorp-Vagrant': 'vagrant',
  'HashiCorp-Terraform': 'terraform',
  'Node.js': 'Nodejs',
  'Vite.js': 'Vitejs',
  'Visual-Studio-Code-(VS-Code)': 'Vscode',
  'Visual-Studio': 'Visualstudio',
  'IntelliJ-IDEA': 'IntellijIdea',
  'Protractor-Test': 'Protractor',
  'JUnit': 'Junit-',
  'JQuery': 'Jquery-',
  'TensorFlow': 'Tensorflow-',
  'TypeScript': 'Typescript-',
  'TeX': 'Tex-',
  'Unified-Modelling-Language-(UML)': 'Uml',
  'NW.js-(node-webkit)': 'Nodewebkit',
  'GraphQL': 'Graphql-',
  'RocksDB': 'Rocksdb-',
  'RabbitMQ': 'Rabbitmq-',
  'Stack-Overflow': 'Stackoverflow',
  'Simple-DirectMedia-Layer-(SDL)': 'Sdl',
  'SonarQube': 'Sonarqube-',
  'Qt-Framework': 'Qt',
  'FSharp-(F#)': 'fsharp',
  'D3.js': 'D3js',
  'C#-(CSharp)': 'Csharp',
  'C++-(CPlusPlus)': 'Cplusplus',
  'Cosmos-BD': 'Cosmosdb',
  'CouchDB': 'Couchdb-',
  'Core-js': 'Corejs',
  'LaTeX': 'Latex-',
  'ESLint': 'Eslint-',
  'DBeaver': 'Dbeaver-',
  'uWSGI': 'uwsgi-',
  'p5-JS': 'p5js',
  'LLVM': 'Llvm-',
  'Karate-Labs': 'Karate',
  'LabVIEW': 'Labview-',
  'SQLite': 'Sqlite-',
  'Vue.js': 'Vue',
  'vSphere': 'vsphere-',
  'WebAssembly': 'Webassembly-',
  'WebStorm': 'Webstorm-',
  'WordPress': 'Wordpress-',
  'Windows-8': 'Windows8',
  'Windows-11': 'Windows11'
}
for (const [oldName, newName] of Object.entries(renames)) {
  await $`mv .tmp/src/tech/${oldName}.svg .tmp/src/tech/${newName}.svg`
}
consola.success('tech-icons - OK')

if (!existsSync('.tmp/gcp.zip')) {
  consola.info('Fetching gcp-icons...')
  await $`curl -o .tmp/gcp.zip  https://icon.icepanel.io/GCP/svg.zip`
}
await rm('.tmp/gcp', { force: true, recursive: true })
await $`unzip .tmp/gcp.zip  -d .tmp/gcp`
await $`mv .tmp/gcp/svg .tmp/src/gcp`
consola.success('gcp-icons - OK')

if (!existsSync('.tmp/aws.zip')) {
  consola.info('Fetching aws-icons...')
  await $`curl -o .tmp/aws.zip https://icon.icepanel.io/AWS/svg.zip`
}
await rm('.tmp/aws', { force: true, recursive: true })
await $`unzip .tmp/aws.zip -d .tmp/aws`
await mkdir('.tmp/src/aws', { recursive: true })

const svgs = await glob('.tmp/aws/**/*.svg')
for (const svg of svgs) {
  const name = svg.split('/').pop()
  await $`mv ${svg} .tmp/src/aws/${name}`
}
consola.success('aws-icons - OK')

await $`rm -r -f ${['aws', 'gcp', 'tech']}`
const opts = [
  '--filename-case',
  'kebab',
  '--ext',
  'jsx',
  '--jsx-runtime',
  'automatic',
  '--svgo-config',
  'svgo.config.json'
]

await $`npx @svgr/cli ${opts} --out-dir . -- .tmp/src`

consola.success('generated svg - DONE')

await $`rm -r -f .tmp/src .tmp/aws .tmp/gcp`

await $`mv aws/index.jsx aws/index.js`
await $`mv gcp/index.jsx gcp/index.js`
await $`mv tech/index.jsx tech/index.js`

const files = [
  ...globSync('aws/*.jsx'),
  ...globSync('gcp/*.jsx'),
  ...globSync('tech/*.jsx')
]

for (const fname of files) {
  const input = readFileSync(fname, 'utf-8')

  const output = `
/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
` + input
  await writeFile(fname, output)
}

consola.start('Formatting...')
await $`dprint fmt ${'./*/*.{jsx,js}'}`

await $`run generate`

consola.success('DONE')
