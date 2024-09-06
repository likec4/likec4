import { createTestServices } from '../test'
import { describe, expect, it } from 'vitest'

describe('formating', () => {
  it(
    'indents',
    async () =>
      expect(await format(
        `
views {
view index {
include *
style user {
color red
}
}
}`
      )).eq(
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
      expect(await format(
        `
views{
  view index   {
    include *
  }
}`
      )).eq(
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
      expect(await format(
        `
model {
  component user'some title''description'
}
views {
  view index {
    include *
  }
}`
      )).eq(
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
      expect(await format(
        `
specification {
  element component
}
model {
  component user {     title 'some title';    description 'description';
  }
}`
      )).eq(
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
      expect(await format(
        `
specification {
  element component
}
model {
  component system1 {
    ->   system2
  }
  component system2
  system2   -[http]->   system1
}
views {
  view index {
    include system1<->*
  }
}`
      )).eq(
        `
specification {
  element component
}
model {
  component system1 {
    -> system2
  }
  component system2
  system2 -[http]-> system1
}
views {
  view index {
    include system1 <-> *
  }
}`
      )
  )

  it(
    'surrounds operators with space',
    async () =>
      expect(await format(
        `
views {
  view index {
    include * where tag==#tag1 
       or(tag!=#tag1   and   tag    is   not#tag1)
    and   not  tag is #tag1
  }
}`
      )).eq(
        `
views {
  view index {
    include * where tag == #tag1 or (tag != #tag1 and tag is not #tag1) and not tag is #tag1
  }
}`
      )
  )

  it(
    'puts tags on a new line',
    async () =>
      expect(await format(
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
      )).eq(
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
      expect(await format(
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
      )).eq(
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

  it.only(
    'separates element kind and name with space',
    async () =>
      expect(await format(
        `
specification {
  element el
}
model {
  el     sys1 'test'
}`
      )).eq(
        `
specification {
  element el
}
model {
  el sys1 'test'
}`
      )
  )
})


async function format(source: string) {
  const { format } = createTestServices()

  return await format(source)
}