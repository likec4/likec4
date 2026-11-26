import { createStyleContext } from '@likec4/styles/jsx'
import { searchOverlay } from '@likec4/styles/recipes'
import type { ReactNode } from 'react'

const { withRootProvider, withContext } = createStyleContext(searchOverlay)

/**
 * Building blocks in the look of the diagram search, defined by the `searchOverlay` recipe of the style preset
 */
export const SearchPanel = {
  Root: withRootProvider(({ children }: { children?: ReactNode }) => <>{children}</>),
  Header: withContext('div', 'header'),
  Field: withContext('div', 'field'),
  Tags: withContext('div', 'tags'),
  Columns: withContext('div', 'columns'),
  Column: withContext('section', 'column'),
  ColumnTitle: withContext('div', 'columnTitle'),
  List: withContext('div', 'list'),
  GroupHead: withContext('div', 'groupHead'),
  Button: withContext('button', 'button'),
  ButtonIcon: withContext('span', 'buttonIcon'),
  ButtonTitle: withContext('span', 'buttonTitle'),
  ButtonDescription: withContext('span', 'buttonDescription'),
  ButtonMeta: withContext('span', 'buttonMeta'),
  Badge: withContext('span', 'badge'),
  Hint: withContext('div', 'hint'),
  Footer: withContext('div', 'footer'),
}
