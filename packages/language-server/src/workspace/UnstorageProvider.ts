import { type Storage, createStorage } from 'unstorage'
import type { LikeC4SharedServices } from '../module'

export interface UnstorageModuleContext {
  unstorage(services: LikeC4SharedServices): Storage
}

export type { Storage as Unstorage } from 'unstorage'

export const MemoryUnstorage: UnstorageModuleContext = {
  unstorage: () => createStorage(),
}
