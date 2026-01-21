import { type TagSpecification, isTagColorSpecified } from '@likec4/core'
import { DefaultTagColors } from '@likec4/core/styles'
import { useMantineStyleNonce } from '@mantine/core'
import { type PropsWithChildren, createContext, memo, useContext } from 'react'
import { entries, flatMap, isEmpty, join, pipe } from 'remeda'
import { useLikeC4Specification } from '../hooks/useLikeC4Model'

const TagStylesContext = createContext<Record<string, TagSpecification>>({})

const radixColors = DefaultTagColors

const generateColorVars = (spec: TagSpecification) => {
  const color = spec.color
  // Tag has a color defined in the specification
  if (isTagColorSpecified(spec)) {
    return `
      --colors-likec4-tag-bg: ${color};
      --colors-likec4-tag-bg-hover: color-mix(in oklab, ${color}, var(--colors-likec4-mix-color) 20%);
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

function generateStylesheet(tags: Record<string, TagSpecification> | undefined, rootSelector: string) {
  if (!tags || isEmpty(tags)) {
    return ''
  }
  return pipe(
    entries(tags),
    flatMap(([tag, spec]) => [
      `:is(${rootSelector} [data-likec4-tag="${tag}"]) {`,
      generateColorVars(spec),
      '}',
    ]),
    join('\n'),
  )
}

export function TagStylesProvider({ children, rootSelector }: PropsWithChildren<{ rootSelector: string }>) {
  const tags = useLikeC4Specification().tags
  const nonce = useMantineStyleNonce()?.()
  const stylesheet = generateStylesheet(tags, rootSelector)

  return (
    <TagStylesContext.Provider value={tags}>
      {stylesheet !== '' && <TagStylesheet nonce={nonce} stylesheet={stylesheet} />}
      {children}
    </TagStylesContext.Provider>
  )
}

const TagStylesheet = memo<{ stylesheet: string; nonce: string | undefined }>(({ stylesheet, nonce }) => {
  return (
    <style
      data-likec4-tags
      type="text/css"
      dangerouslySetInnerHTML={{ __html: stylesheet }}
      nonce={nonce}
    />
  )
})

export function useTagSpecifications() {
  return useContext(TagStylesContext)
}

export function useTagSpecification(tag: string): TagSpecification {
  const specs = useContext(TagStylesContext)
  return specs[tag] ?? {
    color: 'tomato' as any,
  }
}
