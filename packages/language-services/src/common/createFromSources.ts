import { isLikeC4JsonConfig, LikeC4ProjectConfigOps } from '@likec4/config'
import { type Logger, loggable } from '@likec4/log'
import { URI, UriUtils } from 'langium'
import { extname } from 'pathe'
import { entries, map, partition, pipe } from 'remeda'
import { type LikeC4Langium, LikeC4 } from './LikeC4'

/**
 * Runtime-agnostic factory function to create a LikeC4 instance from sources
 */
export async function createFromSources(
  langium: LikeC4Langium,
  logger: Logger,
  sources: Record<string, string>,
): Promise<LikeC4> {
  const uri = URI.from({
    scheme: 'virtual',
    path: '/workspace',
  })

  const workspace = {
    name: 'virtual',
    uri: uri.toString(),
  }

  const WorkspaceManager = langium.shared.workspace.WorkspaceManager
  WorkspaceManager.initialize({
    capabilities: {},
    processId: null,
    rootUri: workspace.uri,
    workspaceFolders: [workspace],
  })
  await WorkspaceManager.initializeWorkspace([
    workspace,
  ])

  const fileExtensions = langium.shared.ServiceRegistry.all.flatMap(e => e.LanguageMetaData.fileExtensions)

  const [configs, docentries] = partition(
    entries(sources),
    ([path]) => isLikeC4JsonConfig(path),
  )

  for (const [path, content] of configs) {
    const configUri = UriUtils.joinPath(uri, path)
    try {
      await langium.shared.workspace.ProjectsManager.registerProject({
        configUri,
        config: LikeC4ProjectConfigOps.parse(content),
      })
    } catch (error) {
      logger.error(loggable(error))
    }
  }

  const docs = pipe(
    docentries,
    map(([path, content]) => {
      if (!fileExtensions.includes(extname(path))) {
        path += '.c4'
      }
      const docuri = UriUtils.joinPath(uri, path)
      return langium.shared.workspace.LangiumDocuments.createDocument(docuri, content)
    }),
  )

  await langium.shared.workspace.DocumentBuilder.build(docs, {
    validation: true,
  })

  return new LikeC4(langium, logger)
}
