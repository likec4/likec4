import { isBoolean, pickBy } from 'remeda'
import type { EnabledFeatures } from '../context/DiagramFeatures'

const key = `likec4:diagram:toggledFeatures`
export const DiagramToggledFeaturesPersistence = {
  read() {
    try {
      let fromStorage = sessionStorage.getItem(key)
      if (fromStorage) {
        return JSON.parse(fromStorage) as Partial<EnabledFeatures>
      }
      throw new Error(`Workspace ${key} not found`)
    } catch (e) {
      console.error(`Error reading fromStorage ${key}:`, e)
      return null
    }
  },
  write<F extends Partial<EnabledFeatures>>(toggledFeatures: F): F {
    sessionStorage.setItem(key, JSON.stringify(pickBy(toggledFeatures, isBoolean)))
    return toggledFeatures
  },
}
