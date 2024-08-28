import { describe } from 'vitest'
import { format } from './asserts'

describe.concurrent('formating', () => {
  format('indents', `
views {
view index {
include *
style user {
color red
}
}
}`, 
  (expect) => expect.eq(`
views {
  view index {
    include *
    style user {
      color red
    }
  }
}`))

  format('prepends open braces with space)', `
views{
  view index   {
    include *
  }
}`,
(expect) => expect.eq(`
views {
  view index {
    include *
  }
}`))

  format('prepends props with space)', `
model {
  component user'some title''description'
}
views {
  view index {
    include *
  }
}`,
(expect) => expect.eq(`
model {
  component user 'some title' 'description'
}
views {
  view index {
    include *
  }
}`))

format('prepends properties with new line)', `
specification {
  element component
}
model {
  component user {     title 'some title';    description 'description';
  }
}`,
  (expect) => expect.eq(`
specification {
  element component
}
model {
  component user {
    title 'some title';
    description 'description';
  }
}`))

format('surrounds arrows with space)', `
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
}`,
  (expect) => expect.eq(`
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
}`))

format('surrounds operators with space)', `
views {
  view index {
    include * where tag==#tag1 
       or(tag!=#tag1   and   tag    is   not#tag1)
    and   not  tag is #tag1
  }
}`,
  (expect) => expect.eq(`
views {
  view index {
    include * where tag == #tag1 or (tag != #tag1 and tag is not #tag1) and not tag is #tag1
  }
}`))

})
