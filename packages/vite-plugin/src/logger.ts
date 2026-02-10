import { rootLogger } from '@likec4/log'

export const logger = rootLogger.getChild('vite-plugin')

export type ViteLogger = typeof logger
