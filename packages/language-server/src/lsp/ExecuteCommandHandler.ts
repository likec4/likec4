import type { ProjectId } from '@likec4/core'
import { DiffId, Fqn, nonNullable } from '@likec4/core'
import { type ExecuteCommandAcceptor, AbstractExecuteCommandHandler } from 'langium/lsp'
import { logger as rootLogger } from '../logger'
import type { ApplyEditsResult, ModelEditRequest } from '../model-diff'
import type { LikeC4Services, LikeC4SharedServices } from '../module'

const logger = rootLogger.getChild('commands')

/**
 * Commands executed by the language server (sent by code actions).
 * Arguments: `[projectId, fqn]` or `[projectId, diffId]`.
 */
export const LikeC4Commands = {
  PreviewRemovalImpact: 'likec4.lsp.preview-removal-impact',
  SafeDelete: 'likec4.lsp.safe-delete',
  ApplyDiff: 'likec4.lsp.apply-diff',
  DiscardDiff: 'likec4.lsp.discard-diff',
} as const

function isLikeC4Services(services: object): services is LikeC4Services {
  return 'likec4' in services
}

function readArgs(args: unknown[]): [ProjectId, string] {
  const [projectId, id] = args
  if (typeof projectId !== 'string' || typeof id !== 'string') {
    throw new Error(`Invalid command arguments: ${JSON.stringify(args)}`)
  }
  return [projectId as ProjectId, id]
}

/**
 * Runs the commands of code actions: removal impact preview, safe delete, apply and discard diff.
 */
export class LikeC4ExecuteCommandHandler extends AbstractExecuteCommandHandler {
  constructor(private shared: LikeC4SharedServices) {
    super()
  }

  private get services(): LikeC4Services {
    return nonNullable(this.shared.ServiceRegistry.all.find(isLikeC4Services), 'LikeC4 services are not registered')
  }

  override registerCommands(acceptor: ExecuteCommandAcceptor): void {
    acceptor(LikeC4Commands.PreviewRemovalImpact, async args => {
      const [projectId, fqn] = readArgs(args)
      await this.services.Rpc.requestRemovalImpact({ projectId, fqn: Fqn(fqn) })
    })
    const edit = (command: string, label: string, toRequest: (id: string) => ModelEditRequest) =>
      acceptor(command, async args => {
        const [projectId, id] = readArgs(args)
        const result = await this.services.likec4.ModelEdits.apply(toRequest(id), { projectId })
        this.report(label, result)
        return result
      })
    edit(LikeC4Commands.SafeDelete, 'Safe delete', fqn => ({ type: 'safe-delete', targets: [fqn] }))
    edit(LikeC4Commands.ApplyDiff, 'Apply diff', id => ({ type: 'apply-diff', diffId: DiffId(id), action: 'apply' }))
    edit(
      LikeC4Commands.DiscardDiff,
      'Discard diff',
      id => ({ type: 'apply-diff', diffId: DiffId(id), action: 'discard' }),
    )
  }

  private report(action: string, { error, remaining }: ApplyEditsResult) {
    const window = this.shared.lsp.Connection?.window
    switch (true) {
      case !!error:
        logger.warn`${action} failed: ${error}`
        window?.showWarningMessage(`LikeC4: ${action} failed: ${error}`)
        break
      case remaining.length > 0:
        window?.showWarningMessage(`LikeC4: ${action} left ${remaining.length} error(s) to fix manually`)
        break
    }
  }
}
