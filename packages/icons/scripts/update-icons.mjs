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
  'Internet-Explorer-10-(ie10)': 'Internet-Explorer',
  'Elastic-Search': 'Elasticsearch',
  'GitLab': 'Gitlab-',
  'GitHub': 'Github-',
  'GitHub-Codespaces': 'GithubCodespaces',
  'GitHub-Actions': 'GithubActions',
  'HashiCorp-Vault': 'HashicorpVault',
  'HashiCorp-Vagrant': 'HashicorpVagrant',
  'HashiCorp-Terraform': 'HashicorpTerraform',
  'Node.js': 'Nodejs',
  'Visual-Studio-Code-(VS-Code)': 'Vscode',
  'IntelliJ-IDEA': 'IntellijIdea',
  'JUnit': 'Junit',
  'JQuery': 'Jquery',
  'NW.js-(node-webkit)': 'NodeWebkit',
  'GraphQL': 'Graphql-',
  'RocksDB': 'Rocksdb-',
  'RabbitMQ': 'Rabbitmq-',
  'Qt-Framework': 'Qt',
  'LLVM': 'Llvm-'
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
