import { expectTypeOf, test } from 'vitest'
import type { ast } from './index'

test('syntax tree types are exported', () => {
  expectTypeOf<ast.Relation['$type']>().toEqualTypeOf<'Relation'>()
  expectTypeOf<ast.Element['$type']>().toEqualTypeOf<'Element'>()
  expectTypeOf<ast.Element['name']>().toEqualTypeOf<string>()
  expectTypeOf<ast.LikeC4Grammar['$type']>().toEqualTypeOf<'LikeC4Grammar'>()
})
