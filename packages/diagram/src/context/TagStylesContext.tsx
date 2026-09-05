import { type TagSpecification, isTagColorSpecified } from '@likec4/core'
import { DefaultTagColors, getContrastedColorsAPCA, isValidColor, LikeC4Styles } from '@likec4/core/styles'
import { useMantineStyleNonce } from '@mantine/core'
import { type PropsWithChildren, createContext, memo, useContext } from 'react'
import { entries, flatMap, isEmpty, join, pipe } from 'remeda'
import { useLikeC4Specification } from '../hooks/useLikeC4Model'
import { useLikeC4Styles } from '../hooks/useLikeC4Styles'

const radixColors: readonly string[] = DefaultTagColors

export function generateColorVars(spec: TagSpecification, styles: LikeC4Styles = LikeC4Styles.DEFAULT): string {
  const color = spec.color
  // Tag has a color defined in the specification — derive a high-contrast text
  // color from it (APCA) so the chip text stays legible on any background.
  // `isTagColorSpecified` is only a prefix check; validate with chroma before
  // we hand the value to APCA, which would otherwise throw on malformed input.
  if (isTagColorSpecified(spec) && isValidColor(color)) {
    const text = getContrastedColorsAPCA(color).hiContrast
    return `
  --colors-likec4-tag-bg: ${color};
  --colors-likec4-tag-bg-hover: color-mix(in oklab, ${color}, var(--colors-likec4-mix-color) 20%);
  --colors-likec4-tag-text: ${text};
    `
  }
  if (radixColors.includes(color)) {
    let textcolor = `var(--colors-${color}-12)`
    if (['mint', 'grass', 'lime', 'yellow', 'amber'].includes(color)) {
      textcolor = 'rgba(0 0 0 / 0.85)'
    }
    return `
  --colors-likec4-tag-border: var(--colors-${color}-8);
  --colors-likec4-tag-bg: var(--colors-${color}-9);
  --colors-likec4-tag-bg-hover: var(--colors-${color}-10);
  --colors-likec4-tag-text: ${textcolor};
    `
  }
  // Theme color (e.g. `primary`, `secondary`) or a project-defined custom color —
  // resolve to actual literal values via the project's LikeC4Styles.
  if (styles.isThemeColor(color)) {
    const { fill, hiContrast } = styles.tagColor(color)
    return `
  --colors-likec4-tag-bg: ${fill};
  --colors-likec4-tag-bg-hover: color-mix(in oklab, ${fill}, var(--colors-likec4-mix-color) 20%);
  --colors-likec4-tag-text: ${hiContrast};
    `
  }
  return ''
}

const TagStylesContext = createContext<Record<string, TagSpecification>>({})

function generateStylesheet(
  tags: Record<string, TagSpecification> | undefined,
  rootSelector: string,
  styles: LikeC4Styles,
) {
  if (!tags || isEmpty(tags)) {
    return ''
  }
  return pipe(
    entries(tags),
    flatMap(([tag, spec]) => [
      `:is(${rootSelector} [data-likec4-tag="${tag}"]) {`,
      generateColorVars(spec, styles),
      '}',
    ]),
    join('\n'),
  )
}

type TagStylesProviderProps = PropsWithChildren<{
  /**
   * Root element selector to scope the tag styles to (e.g., "#diagram-root")
   * Must be a valid CSS selector
   */
  rootSelector: string
}>

export function TagStylesProvider({ children, rootSelector }: TagStylesProviderProps) {
  const tags = useLikeC4Specification().tags
  const styles = useLikeC4Styles()
  const nonce = useMantineStyleNonce()?.()
  const stylesheet = generateStylesheet(tags, rootSelector, styles)

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
