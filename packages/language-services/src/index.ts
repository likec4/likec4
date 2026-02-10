import type { LikeC4 } from './common/LikeC4'
import type { FromWorkspaceOptions } from './common/options'

import {
  fromWorkdir as _workdir,
  fromWorkspace as _workspace,
} from '#init'

export type {
  FromWorkspaceOptions,
  LikeC4,
}

/**
 * Create a LikeC4 instance from a workspace directory
 * @param workspace - The workspace directory path
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromWorkspace(workspace: string, options?: FromWorkspaceOptions): Promise<LikeC4> {
  return _workspace(workspace, options)
}

/**
 * Create a LikeC4 instance from the current working directory
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromWorkdir(options?: FromWorkspaceOptions): Promise<LikeC4> {
  return _workdir(options)
}
