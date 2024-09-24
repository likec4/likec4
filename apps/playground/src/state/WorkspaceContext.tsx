import { createContext } from 'react'
import type { CreatedWorkspaceStore } from './store'

export const WorkspaceContext = createContext<CreatedWorkspaceStore | null>(null)
