import { resolve } from 'node:path'
import { exit } from 'node:process'
import k from 'tinyrainbow'
import { LikeC4 } from '../../LikeC4'
import { createLikeC4Logger } from '../../logger'

export async function checkHandler(args: { path: string }) {
  const logger = createLikeC4Logger('c4:federation')
  logger.info(k.cyan('Running federation composition check (dry-run)...'))

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
    logger.error('No federation exports configured.')
    exit(1)
  }

  const publishConfig = federation.publish
  const registryDir = publishConfig?.registryDir
    ? resolve(project.folderUri.fsPath, publishConfig.registryDir)
    : undefined

  if (!registryDir) {
    logger.error('No registryDir configured in federation.publish. Cannot run composition check.')
    exit(1)
  }

  const model = likec4.syncComputedModel(projectId)
  const { buildManifest, createFederatedRegistry, checkComposition } = await import('@likec4/federation')

  const manifest = buildManifest(model, federation, {})

  const registry = createFederatedRegistry(registryDir)
  const registryData = await registry.readRegistry()
  const result = checkComposition(manifest.name, manifest, registryData)

  if (!result.ok) {
    logger.error(k.red('Composition check FAILED! Breaking changes:'))
    for (const change of result.breakingChanges) {
      logger.error(`  Consumer "${change.consumer}" depends on missing FQNs:`)
      for (const fqn of change.missingFqns) {
        logger.error(`    - ${fqn}`)
      }
    }
    exit(1)
  }

  logger.info(k.green('Composition check passed. No breaking changes detected.'))
  logger.info(`Manifest exports ${Object.keys(manifest.elements).length} elements.`)
}
