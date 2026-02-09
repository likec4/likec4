import { resolve } from 'node:path'
import { exit } from 'node:process'
import k from 'tinyrainbow'
import { LikeC4 } from '../../LikeC4'
import { createLikeC4Logger } from '../../logger'

export async function syncHandler(args: { path: string }) {
  const logger = createLikeC4Logger('c4:federation')
  logger.info(k.cyan('Syncing consumer import contracts...'))

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
  const deps = federation?.dependencies
  if (!deps || Object.keys(deps).length === 0) {
    logger.error('No federation dependencies configured for this project.')
    exit(1)
  }

  const { createFederatedRegistry } = await import('@likec4/federation')

  // Group dependencies by registry source, since different deps may come from different registries
  const depsBySource = new Map<string, Record<string, string[]>>()
  for (const [depName, dep] of Object.entries(deps)) {
    const registryDir = resolve(project.folderUri.fsPath, dep.source)
    const registry = createFederatedRegistry(registryDir)

    try {
      const manifest = await registry.readManifest(depName)
      const fqns = Object.keys(manifest.elements)
      logger.info(`  ${depName}: ${fqns.length} elements`)

      const existing = depsBySource.get(registryDir) ?? {}
      existing[depName] = fqns
      depsBySource.set(registryDir, existing)
    } catch {
      logger.warn(`  Could not read manifest for "${depName}", skipping`)
    }
  }

  if (depsBySource.size === 0) {
    logger.warn('No manifests resolved. Nothing to sync.')
    exit(0)
  }

  // Sync consumer contract to each registry
  for (const [registryDir, imports] of depsBySource) {
    const registry = createFederatedRegistry(registryDir)
    await registry.syncConsumer(projectId as string, imports)
    logger.info(k.green(`Synced consumer contract for "${projectId}" to ${registryDir}`))
  }
}
