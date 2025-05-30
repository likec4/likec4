import type { TagSpecification } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import { useDeepCompareMemo } from '@react-hookz/web'
import { type PropsWithChildren, createContext, useContext } from 'react'

const TagStylesContext = createContext<Record<string, TagSpecification>>({})

export function TagStylesProvider({ children, likec4model }: PropsWithChildren<{ likec4model: LikeC4Model }>) {
  const tags = likec4model.specification.tags ?? null
  const specs = useDeepCompareMemo(() => {
    if (!tags) {
      return {}
    }
    return tags
  }, [tags])
  return (
    <TagStylesContext.Provider value={specs}>
      {children}
    </TagStylesContext.Provider>
  )
}

export function useTagStyles() {
  const specs = useContext(TagStylesContext)
  return {
    specs,
    isCustom(name: string) {
      const color = specs[name]?.color
      return color && (color.startsWith('#') || color.startsWith('rgb'))
    },
    getTagColor(name: string): string {
      return specs[name]?.color ?? 'gray'
    },
  }
}

export function useTagStyle(name: string): TagSpecification {
  const { specs } = useTagStyles()
  return specs[name] ?? {
    color: 'gray',
  }
}
