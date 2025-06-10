import { type TagSpecification, isTagColorSpecified } from '@likec4/core'
import { useMantineStyleNonce } from '@mantine/core'
import { useDeepCompareMemo } from '@react-hookz/web'
import { type PropsWithChildren, createContext, useContext } from 'react'
import { entries, flatMap, join, pipe } from 'remeda'
import { useLikeC4Specification } from '../likec4model/useLikeC4Model'

const TagStylesContext = createContext<Record<string, TagSpecification>>({})

const radixColors = [
  'yellow',
  'orange',
  'amber',
  'tomato',
  'red',
  'ruby',
  'crimson',
  'pink',
  'pink',
  'purple',
  'violet',
  'indigo',
  'blue',
  'teal',
  'grass',
  'lime',
]

const generateColorVars = (spec: TagSpecification) => {
  const color = spec.color
  if (isTagColorSpecified(spec)) {
    return `
      --colors-likec4-tag-bg: ${color};
      --colors-likec4-tag-bg-hover: color-mix(in srgb, ${color}, var(--colors-likec4-mix-color) 20%);
    `
  }
  if (!radixColors.includes(color)) {
    return ''
  }
  let textcolor = '12'
  if (['mint', 'grass', 'lime', 'yellow', 'amber'].includes(color)) {
    textcolor = 'dark-2'
  }
  return `
  --colors-likec4-tag-border: var(--colors-${color}-8);
  --colors-likec4-tag-bg: var(--colors-${color}-9);
  --colors-likec4-tag-bg-hover: var(--colors-${color}-10);
  --colors-likec4-tag-text: var(--colors-${color}-${textcolor});
  `
}

export function TagStylesProvider({ children, rootSelector }: PropsWithChildren<{ rootSelector: string }>) {
  const tags = useLikeC4Specification().tags
  const { specs, stylesheet } = useDeepCompareMemo(() => {
    if (!tags) {
      return { specs: {}, stylesheet: '' }
    }
    return {
      specs: tags,
      stylesheet: pipe(
        entries(tags),
        flatMap(([tag, spec]) => [
          `:is(${rootSelector} [data-likec4-tag="${tag}"]) {`,
          generateColorVars(spec),
          '}',
        ]),
        join('\n'),
      ),
    }
  }, [tags, rootSelector])

  return (
    <TagStylesContext.Provider value={specs}>
      {stylesheet !== '' && <TagStylesheet stylesheet={stylesheet} />}
      {children}
    </TagStylesContext.Provider>
  )
}

function TagStylesheet({ stylesheet }: { stylesheet: string }) {
  const nonce = useMantineStyleNonce()?.()
  return (
    <style data-likec4-tag-stylesheet type="text/css" dangerouslySetInnerHTML={{ __html: stylesheet }} nonce={nonce} />
  )
}

export function useTagSpecifications() {
  return useContext(TagStylesContext)
}

export function useTagSpecification(tag: string): TagSpecification {
  const specs = useContext(TagStylesContext)
  return specs[tag] ?? {
    color: 'tomato' as any,
  }
}
