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

  // Build import map from resolved dependencies
  const imports: Record<string, string[]> = {}
  for (const [depName, dep] of Object.entries(deps)) {
    // Resolve the registry to read the manifest and get element FQNs
    const registryDir = resolve(project.folderUri.fsPath, dep.source)
    const { createFederatedRegistry } = await import('@likec4/federation')
    const registry = createFederatedRegistry(registryDir)

    try {
      const manifest = await registry.readManifest(depName)
      imports[depName] = Object.keys(manifest.elements)
      logger.info(`  ${depName}: ${imports[depName]!.length} elements`)
    } catch {
      logger.warn(`  Could not read manifest for "${depName}", skipping`)
    }
  }

  if (Object.keys(imports).length === 0) {
    logger.warn('No manifests resolved. Nothing to sync.')
    exit(0)
  }

  // Find the registry dir from the first dependency's source
  const firstDep = Object.values(deps)[0]!
  const registryDir = resolve(project.folderUri.fsPath, firstDep.source)
  const { createFederatedRegistry } = await import('@likec4/federation')
  const registry = createFederatedRegistry(registryDir)
  await registry.syncConsumer(projectId as string, imports)

  logger.info(k.green(`Synced consumer contract for "${projectId}" to registry.`))
}
