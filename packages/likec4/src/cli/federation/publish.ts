import { resolve } from 'node:path'
import { exit } from 'node:process'
import k from 'tinyrainbow'
import { LikeC4 } from '../../LikeC4'
import { createLikeC4Logger } from '../../logger'

export async function publishHandler(args: { path: string }) {
  const logger = createLikeC4Logger('c4:federation')
  logger.info(k.cyan('Publishing federation manifest...'))

  await using likec4 = await LikeC4.fromWorkspace(args.path, {
    graphviz: 'wasm',
    watch: false,
    logger: false,
  })

  const projectId = likec4.projectsManager.defaultProjectId
  if (!projectId) {
    logger.error('No project found. Ensure a likec4.config.json exists.')
    exit(1)
  }

  const project = likec4.projectsManager.getProject(projectId)
  const federation = project.config.federation
  if (!federation?.exports || federation.exports.length === 0) {
    logger.error('No federation exports configured in the project config.')
    exit(1)
  }

  const publishConfig = federation.publish
  if (!publishConfig) {
    logger.error('No federation publish config found. Add "federation.publish" to your likec4.config.json.')
    exit(1)
  }

  const model = likec4.syncComputedModel(projectId)
  const { buildManifest, createFederatedRegistry, checkComposition } = await import('@likec4/federation')

  const manifest = buildManifest(model, federation, {})

  // If registryDir is configured, run composition check
  const registryDir = publishConfig.registryDir
    ? resolve(project.folderUri.fsPath, publishConfig.registryDir)
    : undefined

  if (registryDir) {
    const registry = createFederatedRegistry(registryDir)
    const registryData = await registry.readRegistry()
    const result = checkComposition(manifest.name, manifest, registryData)

    if (!result.ok) {
      logger.error(k.red('Composition check failed! Breaking changes detected:'))
      for (const change of result.breakingChanges) {
        logger.error(`  Consumer "${change.consumer}" depends on missing FQNs:`)
        for (const fqn of change.missingFqns) {
          logger.error(`    - ${fqn}`)
        }
      }
      exit(1)
    }
    logger.info(k.green('Composition check passed.'))
  }

  // Write manifest
  const outDir = resolve(project.folderUri.fsPath, publishConfig.outDir)
  if (registryDir) {
    const registry = createFederatedRegistry(registryDir)
    await registry.publishManifest(manifest.name, manifest)
    logger.info(k.green(`Published manifest to ${registryDir}/${manifest.name}/manifest.json`))
  } else {
    // Fallback: write directly to outDir
    const { mkdir, writeFile } = await import('node:fs/promises')
    await mkdir(outDir, { recursive: true })
    const manifestPath = resolve(outDir, 'manifest.json')
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8')
    logger.info(k.green(`Published manifest to ${manifestPath}`))
  }

  logger.info(k.green('Done.'))
}
