import { describe } from 'vitest'
import { testFileScope as it } from '../test'

// Editors on Windows often save UTF-8 files with a byte order mark
describe('byte order mark', () => {
  it('accepts a document that starts with a UTF-8 BOM', async ({ expect, t }) => {
    const { formattedError } = await t.validate(
      '﻿specification {\n  element system\n}\nmodel {\n  a = system\n}\n',
    )
    expect(formattedError).toEqual('')
  })

  it('accepts a BOM followed by a comment and CRLF line endings', async ({ expect, t }) => {
    const { formattedError } = await t.validate(
      '﻿// model\r\nspecification {\r\n  element system\r\n}\r\nmodel {\r\n  a = system\r\n}\r\n',
    )
    expect(formattedError).toEqual('')
  })
})
