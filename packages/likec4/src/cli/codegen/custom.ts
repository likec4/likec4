import type { GeneratorFn } from '@likec4/config'
import type { Locate } from '@likec4/language-server/protocol'
import type { Logger } from '@likec4/log'
import type { LikeC4 } from '../../LikeC4'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { nonexhaustive } from '@likec4/core'
import {
  type AnyLikeC4Model,
  isDeploymentElementModel,
  isDeploymentRelationModel,
  isElementModel,
  isLikeC4ViewModel,
  isRelationModel,
} from '@likec4/core/model'
import { documentSourceUri } from '@likec4/language-server'
import { UriUtils } from 'langium'
import k from 'tinyrainbow'
import { URI } from 'vscode-uri'
import { logger as cliLogger, startTimer } from '../../logger'
import { ensureProject, initLikeC4 } from '../utils'

const logger = cliLogger.getChild('generator')

type HandlerParams = {
  name: string
  project: string | undefined
  path: string
  useDotBin: boolean
}

/** Runs a custom generator by name from project config (generators[name]). */
export async function customHandler({ name, path, useDotBin, project }: HandlerParams) {
  const timer = startTimer(logger)
  await using likec4 = await initLikeC4({ path: path, project: project, useDotBin: useDotBin })
  const { projectId, config } = ensureProject(likec4)

  if (project) {
    logger.info(`${k.dim('project')} ${k.green(projectId)}`)
  }
  const generator = config.generators?.[name]
  if (!generator) {
    logger.error(k.red(`generator ${name} does not exist in project config`))
    throw new Error(`generator ${name} does not exist in project config`)
  }
  logger.info(`${k.dim('generator')} ${k.green(name)}`)

  const model = await likec4.layoutedModel(projectId)

  await runCustomGenerator({
    likec4,
    model,
    generator,
    logger: logger.getChild(name),
  })

  timer.stopAndLog()
}

async function runCustomGenerator({
  likec4,
  model,
  generator,
  logger,
}: {
  likec4: LikeC4
  model: AnyLikeC4Model
  generator: GeneratorFn
  logger: Logger
}) {
  const languageServices = likec4.languageServices
  const createdDirs = new Set<string>()
  const project = languageServices.project(model.project.id)
  const projectId = model.project.id
  logger.debug(`${k.dim('running for project:')} ${k.green(project.id)}`)
  await Promise.resolve().then(() =>
    generator({
      likec4model: model,
      ctx: {
        workspace: likec4.languageServices.workspaceUri,
        project,
        locate: (target) => {
          let location: Locate.Res = null
          switch (true) {
            case isElementModel(target):
              location = languageServices.locate({ element: target.id, projectId })
              break
            case isLikeC4ViewModel(target):
              location = languageServices.locate({ view: target.id, projectId })
              break
            case isDeploymentElementModel(target):
              location = languageServices.locate({ deployment: target.id, projectId })
              break
            case isRelationModel(target):
            case isDeploymentRelationModel(target):
              location = languageServices.locate({ relation: target.id, projectId })
              break
            default:
              nonexhaustive(target)
          }
          if (!location) {
            logger.error(`Cannot locate ${target.id}`, { target })
            throw new Error(`Cannot locate ${target.id}`)
          }
          // Elements imported from a local dependency are located in its real file (not the likec4-dep document)
          const document = documentSourceUri(URI.parse(location.uri))
          return {
            range: location.range,
            document,
            relativePath: UriUtils.relative(project.folder, document),
            folder: UriUtils.dirname(document).fsPath,
            filename: UriUtils.basename(document),
          }
        },
        write: async ({ path, content }) => {
          let filepath
          if (Array.isArray(path)) {
            filepath = resolve(project.folder.fsPath, ...path)
          } else if (URI.isUri(path)) {
            filepath = path.fsPath
          } else {
            filepath = resolve(project.folder.fsPath, `${path}`)
          }
          const outDir = dirname(filepath)
          if (!createdDirs.has(outDir)) {
            if (!existsSync(outDir)) {
              logger.debug(`${k.dim('create directory')} ${outDir}`)
              await mkdir(outDir, { recursive: true })
            }
            createdDirs.add(outDir)
          }
          logger.debug(`${k.dim('write')} ${filepath}`)
          await writeFile(filepath, content)
        },
        abort: (reason) => {
          logger.error(reason || 'Generator aborted')
          throw new Error(reason || 'Generator aborted')
        },
      },
    })
  )
}
