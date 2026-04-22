import { compareNaturalHierarchically } from '@likec4/core/utils'
import type { FileSystemNode } from 'langium'
import { LikeC4LanguageMetaData } from '../generated/module'

export function hasLikeC4Ext(path: string) {
  return LikeC4LanguageMetaData.fileExtensions.some((ext) => path !== ext && path.endsWith(ext))
}

const nodeModulesOrRepo = ['node_modules', '.git', '.svn', '.yarn', '.pnpm']
/**
 * Check if the given directory name is a node_modules or repository directory
 */
export function isNodeModulesOrRepo(basename: string) {
  return nodeModulesOrRepo.includes(basename)
}

export function insideNodeModulesOrRepo(path: string) {
  for (const dir of nodeModulesOrRepo) {
    if (path.includes(dir)) {
      return true
    }
  }
  return false
}

/**
 * Compare function for document paths to ensure consistent order
 */
const compare = compareNaturalHierarchically('/')

export function ensureOrder(a: FileSystemNode, b: FileSystemNode) {
  return compare(a.uri.path, b.uri.path)
}
