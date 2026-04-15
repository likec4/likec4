import { rootLogger } from '@likec4/log'
import { k } from './virtuals/_shared'

export const logger = rootLogger.getChild('vite')

export type ViteLogger = typeof logger

export function logGenerating(moduleId: string, projectId?: string) {
  if (projectId) {
    logger.info(k.dim(`generating `) + k.magenta(`likec4:${moduleId}/`) + k.magentaBright(projectId))
  } else {
    logger.info(k.dim(`generating `) + k.magenta(`likec4:${moduleId}`))
  }
}
