import { it, type Assertion, type ExpectStatic } from 'vitest'
import { createTestServices } from '../../test'

export async function format(name: string, source: string, test: ((_: Assertion<string>) => void)) {
  return it(name, async (context: { expect: ExpectStatic }) => {
      const { format } = createTestServices()

      const formattedDocument = await format(source)

      test(context.expect(formattedDocument))
    }
  )
}