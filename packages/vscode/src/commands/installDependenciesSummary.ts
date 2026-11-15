import type { InstallDependencies } from '@likec4/language-server/protocol'

type DependencyInstallResult = InstallDependencies.Res['results'][number]['result']

/**
 * Summary of the results of the server command, shown to the user.
 * A missing result means the server does not handle the command.
 */
export function summarizeInstallResults(
  res: InstallDependencies.Res | null | undefined,
  update: boolean,
): { level: 'info' | 'warning' | 'error'; message: string } {
  if (!res || !Array.isArray(res.results)) {
    return { level: 'error', message: 'The LikeC4 language server does not support installing dependencies' }
  }
  const results = res.results
  if (results.length === 0) {
    return { level: 'info', message: 'LikeC4: no git dependencies found' }
  }
  let downloaded = 0
  let cached = 0
  let unsupported = 0
  const failed: string[] = []
  for (const entry of results) {
    const result: Partial<DependencyInstallResult> | undefined = entry?.result
    const label = `${entry?.projectId ?? '?'}/${entry?.name ?? '?'}`
    switch (result?.status) {
      case 'installed':
        if (result.cached) {
          cached++
        } else {
          downloaded++
        }
        break
      case 'unsupported':
        unsupported++
        break
      case 'failed':
        failed.push(`${label}: ${result.error ?? 'unknown error'}`)
        break
      default:
        // Malformed entry or unknown status
        failed.push(`${label}: unexpected result`)
        break
    }
  }
  const parts = [
    `${downloaded} ${update ? 'updated' : 'installed'}`,
    ...(cached > 0 ? [`${cached} already ${update ? 'up to date' : 'installed'}`] : []),
    ...(unsupported > 0 ? [`${unsupported} not supported in this environment`] : []),
    ...(failed.length > 0 ? [`${failed.length} failed (${failed.join('; ')})`] : []),
  ]
  return {
    level: failed.length > 0 || unsupported > 0 ? 'warning' : 'info',
    message: `LikeC4 git dependencies: ${parts.join(', ')}`,
  }
}
