import type { Viewport } from '@xyflow/react'

const key = `likec4:projects-overview:lastViewport`
export const ProjectsOverviewViewportPersistence = {
  read() {
    try {
      let fromStorage = sessionStorage.getItem(key)
      if (fromStorage) {
        return JSON.parse(fromStorage) as Viewport
      }
      return null
    } catch (e) {
      console.error(`Error reading fromStorage ${key}:`, e)
      return null
    }
  },
  write(viewport: Viewport | null) {
    if (!viewport) {
      sessionStorage.removeItem(key)
      return
    }
    sessionStorage.setItem(key, JSON.stringify(viewport))
  },
}
