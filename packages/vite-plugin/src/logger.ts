import { rootLogger } from '@likec4/log'

export const logger = rootLogger.getChild('vite')

export type ViteLogger = typeof logger
