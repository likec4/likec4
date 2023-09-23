import { useStore } from '@nanostores/react'
import { $currentView } from './stores'

export const useCurrentView = () => useStore($currentView)
