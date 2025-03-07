import type { GithubLogin, ISODatetime } from '#worker/types'
import type { ActorRefFromLogic, SnapshotFrom } from 'xstate'
import type { PlaygroundMachineLogic } from './playground-machine'
import type { ShareOptions } from './shareOptions'

export type PlaygroundActorRef = ActorRefFromLogic<PlaygroundMachineLogic>
export type PlaygroundActorSnapshot = SnapshotFrom<PlaygroundMachineLogic>

export type { PlaygroundContext } from './playground-machine'

export type WithInput<T> = { input: T }

export type ShareHistoryItem = {
  shareId: string
  createdAt: ISODatetime
  expiresAt: ISODatetime
  userId: number | null
  shareOptions: ShareOptions
}
export type LocalWorkspace = {
  workspaceId: string
  title: string
  activeFilename: string
  files: Record<string, string>
  shareHistory?: Array<ShareHistoryItem>
  forkedFrom?: {
    shareId: string
    author: GithubLogin | null
    expiresAt: ISODatetime
  }
}
