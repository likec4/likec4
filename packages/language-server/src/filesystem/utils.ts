import { compareNaturalHierarchically } from '@likec4/core/utils'
import type { FileSystemNode } from 'langium'
import { LikeC4LanguageMetaData } from '../generated/module'

export function hasLikeC4Ext(path: string) {
  return LikeC4LanguageMetaData.fileExtensions.some((ext) => path !== ext && path.endsWith(ext))
}

export function excludeNodeModules(dirName: string) {
  return ['node_modules', '.git', '.svn', '.yarn', '.pnpm'].includes(dirName)
}

/**
 * Compare function for document paths to ensure consistent order
 */
const compare = compareNaturalHierarchically('/')

export function ensureOrder(a: FileSystemNode, b: FileSystemNode) {
  return compare(a.uri.path, b.uri.path)
}
