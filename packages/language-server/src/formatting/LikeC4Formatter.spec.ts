import { describe, expect, it } from 'vitest'
import { createTestServices } from '../test'

describe('formating', () => {
  it(
    'indents',
    async () =>
      expect(
        await format(
          `
views {
view index {
include *
style user {
color red
}
}
}`
        )
      ).eq(
        `
views {
  view index {
    include *
    style user {
      color red
    }
  }
}`
      )
  )

  it(
    'prepends open braces with space',
    async () =>
      expect(
        await format(
          `
views{
  view index   {
    include *
  }
}`
        )
      ).eq(
        `
views {
  view index {
    include *
  }
}`
      )
  )

  it(
    'prepends props with space',
    async () =>
      expect(
        await format(
          `
model {
  component user'some title''description'
}
views {
  view index {
    include *
  }
}`
        )
      ).eq(
        `
model {
  component user 'some title' 'description'
}
views {
  view index {
    include *
  }
}`
      )
  )

  it(
    'prepends properties with new line',
    async () =>
      expect(
        await format(
          `
specification {
  element component
}
model {
  component user {     title 'some title';    description 'description';
  }
}`
        )
      ).eq(
        `
specification {
  element component
}
model {
  component user {
    title 'some title';
    description 'description';
  }
}`
      )
  )

  it(
    'surrounds arrows with space',
    async () =>
      expect(
        await format(
          `
specification {
  element component
}
model {
  component system1 {
    ->   system2
    .http    system2
  }
  component system2
  system2   -[   http   ]->   system1
  system2  .http   system1
}
views {
  view index {
    include system1<->*
  }
}`
        )
      ).eq(
        `
specification {
  element component
}
model {
  component system1 {
    -> system2
    .http system2
  }
  component system2
  system2 -[http]-> system1
  system2 .http system1
}
views {
  view index {
    include system1 <-> *
  }
}`
      )
  )

  it(
    'formats where expression',
    async () =>
      expect(
        await format(
          `
views {
  view index {
    include * where    tag==#tag1 
       or(tag!=#tag1   and   kind    is   not    kind1)
    and   not  tag   is   #tag1
    include *->* where    tag==#tag2 
       or(tag!=#tag2   and   kind    is   not    kind2)
    and   not  tag is   #tag2
  }
}`
        )
      ).eq(
        `
views {
  view index {
    include
      * where tag == #tag1 or (tag != #tag1 and kind is not kind1) and not tag is #tag1
    include
      * -> * where tag == #tag2 or (tag != #tag2 and kind is not kind2) and not tag is #tag2
  }
}`
      )
  )

  it(
    'puts tags on a new line',
    async () =>
      expect(
        await format(
          `
specification {
  element el
  tag tag1
  tag tag2
}
model {
  el sys1 'test' {           #tag1, #tag2
  }
}`
        )
      ).eq(
        `
specification {
  element el
  tag tag1
  tag tag2
}
model {
  el sys1 'test' {
    #tag1, #tag2
  }
}`
      )
  )

  it(
    'handles comments',
    async () =>
      expect(
        await format(
          `
specification {
      // comment
      // comment2
      // comment3
element el
tag tag1
}
model {
        // comment
  el sys1 'test' {
  // comment
#tag1
}
}`
        )
      ).eq(
        `
specification {
  // comment
  // comment2
  // comment3
  element el
  tag tag1
}
model {
  // comment
  el sys1 'test' {
    // comment
    #tag1
  }
}`
      )
  )

  it(
    'separates element kind and name with space',
    async () =>
      expect(
        await format(
          `
specification {
  element el
}
model {
  el     sys1 'test'
}`
        )
      ).eq(
        `
specification {
  element el
}
model {
  el sys1 'test'
}`
      )
  )

  it(
    'format specification rules',
    async () =>
      expect(
        await format(
          `
specification{
  element     el

  relationship     rel

  tag   tag1
  color    custom #123456
}`
        )
      ).eq(
        `
specification {
  element el
  relationship rel
  tag tag1
  color custom #123456
}`
      )
  )

  it(
    'format include/exclude expressions',
    async () =>
      expect(
        await format(
          `
views {
  view index {
    include      test , test.*
    include      test1 
    , test2.*, test3
    include *   ,    * -> *  ,  * ->
    exclude * ,   * -> *, * ->
  }
}`
        )
      ).eq(
        `
views {
  view index {
    include test, test.*
    include
      test1,
      test2.*,
      test3
    include *, * -> *, * ->
    exclude *, * -> *, * ->
  }
}`
      )
  )
})

async function format(source: string) {
  const { format } = createTestServices()

  return await format(source)
}
