import type { LikeC4SharedServices } from '../module'
import { type Storage, createStorage } from 'unstorage'

export interface UnstorageModuleContext {
  unstorage(services: LikeC4SharedServices): Storage
}

export type { Storage as Unstorage } from 'unstorage'

export const MemoryUnstorage: UnstorageModuleContext = {
  unstorage: () => createStorage(),
}
