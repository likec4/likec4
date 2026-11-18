import { isBoolean } from 'remeda'
import type { EnabledFeatures, TogglableFeature } from '../../context/DiagramFeatures'

type PersistedToggledFeatures = Partial<Pick<EnabledFeatures, `enable${TogglableFeature}`>>

const key = `likec4:diagram:toggledFeatures`

/**
 * Picks only togglable features with boolean values
 * (ignores unknown keys, e.g. persisted by previous versions)
 */
function pickTogglable(value: unknown): PersistedToggledFeatures {
  if (typeof value !== 'object' || value === null || !('enableReadOnly' in value)) {
    return {}
  }
  return isBoolean(value.enableReadOnly) ? { enableReadOnly: value.enableReadOnly } : {}
}

export const DiagramToggledFeaturesPersistence = {
  read(): PersistedToggledFeatures | null {
    try {
      let fromStorage = sessionStorage.getItem(key)
      if (fromStorage) {
        return pickTogglable(JSON.parse(fromStorage))
      }
      return null
    } catch (e) {
      if (import.meta.env.MODE !== 'test') {
        console.error(`Error reading fromStorage ${key}:`, e)
      }

      return null
    }
  },
  write<F extends PersistedToggledFeatures>(toggledFeatures: F): F {
    sessionStorage.setItem(key, JSON.stringify(pickTogglable(toggledFeatures)))
    return toggledFeatures
  },
}
