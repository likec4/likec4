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
  'ESLint': 'Eslint-',
  'DBeaver': 'Dbeaver-',
  'uWSGI': 'uwsgi-',
  'LLVM': 'Llvm-',
  'Vue.js': 'Vue',
  'vSphere': 'vsphere-',
  'WebAssembly': 'Webassembly-',
  'WebStorm': 'Webstorm-',
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

await $`rm -r -f ${'src/'}`
const opts = [
  '--typescript',
  '--filename-case',
  'kebab',
  '--jsx-runtime',
  'automatic',
  '--svgo-config',
  'svgo.config.json'
]

await $`npx @svgr/cli ${opts} --out-dir src -- .tmp/src`

consola.success('generated svg tsx - DONE')

await $`rm -r -f .tmp/src .tmp/aws .tmp/gcp`

for (const fname of globSync(`src/*/*.tsx`)) {
  const input = readFileSync(fname, 'utf-8')
  const output = input
    .replaceAll(/InkscapeStroke: "none",/g, '')
    .replaceAll(/shape(Margin|Padding): 0,/g, '')
    .replaceAll(/solid(Color|Opacity):([^,]+),/g, '')
  if (input !== output) {
    consola.info(`Updating ${fname}`)
    await writeFile(fname, output)
  }
}

consola.start('Building TypeScript')

await $`rm -r -f ${'dist/'}`
await $`tsc`
await $`dprint fmt ${'./src/**/*'}`

consola.success('DONE')
