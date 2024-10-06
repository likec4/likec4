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
dynamic view dynamic-view-1 {
parallel {
sys1 -> sys2
}
par {
sys2 -> sys3
}
} 
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        views {
          view index {
            include *
            style user {
              color red
            }
          }
          dynamic view dynamic-view-1 {
            parallel {
              sys1 -> sys2
            }
            par {
              sys2 -> sys3
            }
          }
        }"
      `
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
      ).toMatchInlineSnapshot(
        `
        "
        views {
          view index {
            include *
          }
        }"
      `
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
      ).toMatchInlineSnapshot(
        `
        "
        model {
          component user 'some title' 'description'
        }
        views {
          view index {
            include *
          }
        }"
      `
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
      ).toMatchInlineSnapshot(
        `
        "
        specification {
          element component
        }
        model {
          component user {
            title 'some title';
            description 'description';
          }
        }"
      `
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
  relationship http
  tag tag1
}
model {
  component system1 {    
    component module1 {
        component lib1
    }

    ->   system2
    .http    system2
  }
  component system2 {   
    component module1 {
        component lib1
    }
  }
  system2   ->   system1
  system2   -[   http   ]->   system1

  system2.module1   ->     system1.module1
  system2.module1.lib1   ->system1.module1.lib1
  system2.module1   -[   http   ]->   system1.module1
  system2.module1  .http   system1.module1   'title'  'http'    #tag1  
}
views {
  view index {
    include system1<->*
    include *->, ->*
    include system1.module1<->*
    include ->    system1.module1   ->
  }

  dynamic view some {
    system2   ->   system1
    system2   -[   http   ]->   system1

    system2.module1   ->     system1.module1
    system2.module1.lib1   ->system1.module1.lib1
    system2.module1   -[   http   ]->   system1.module1
    system2.module1  .http   system1.module1   'title' 
  }
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        specification {
          element component
          relationship http
          tag tag1
        }
        model {
          component system1 {
            component module1 {
              component lib1
            }

            -> system2
            .http system2
          }
          component system2 {
            component module1 {
              component lib1
            }
          }
          system2 -> system1
          system2 -[http]-> system1

          system2.module1 -> system1.module1
          system2.module1.lib1 -> system1.module1.lib1
          system2.module1 -[http]-> system1.module1
          system2.module1 .http system1.module1 'title' 'http' #tag1
        }
        views {
          view index {
            include system1 <-> *
            include * ->, -> *
            include system1.module1 <-> *
            include -> system1.module1 ->
          }

          dynamic view some {
            system2 -> system1
            system2 -[http]-> system1

            system2.module1 -> system1.module1
            system2.module1.lib1 -> system1.module1.lib1
            system2.module1 -[http]-> system1.module1
            system2.module1 .http system1.module1 'title'
          }
        }"
      `
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
      ).toMatchInlineSnapshot(
        `
        "
        views {
          view index {
            include
              * where tag == #tag1 or (tag != #tag1 and kind is not kind1) and not tag is #tag1
            include
              * -> * where tag == #tag2 or (tag != #tag2 and kind is not kind2) and not tag is #tag2
          }
        }"
      `
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
      ).toMatchInlineSnapshot(
        `
        "
        specification {
          element el
          tag tag1
          tag tag2
        }
        model {
          el sys1 'test' {
            #tag1, #tag2
          }
        }"
      `
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
      ).toMatchInlineSnapshot(
        `
        "
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
        }"
      `
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
      ).toMatchInlineSnapshot(
        `
        "
        specification {
          element el
        }
        model {
          el sys1 'test'
        }"
      `
      )
  )

  it(
    'formats specification rules',
    async () =>
      expect(
        await format(
          `
specification{
  element     el

  relationship     rel

  tag   tag1
  color    custom      #123456
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        specification {
          element el

          relationship rel

          tag tag1
          color custom #123456
        }"
      `
      )
  )

  it(
    'formats include/exclude expressions',
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
      ).toMatchInlineSnapshot(
        `
        "
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
        }"
      `
      )
  )

  it(
    'formats view declarations',
    async () =>
      expect(
        await format(
          `
views {
  view    index{
  }
  view{
  }
  view  view1  of   el1  {
  }
  view  view2  extends   baseView  {
  }
  dynamic     view  view3  {
  }
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        views {
          view index {
          }
          view {
          }
          view view1 of el1 {
          }
          view view2 extends baseView {
          }
          dynamic view view3 {
          }
        }"
      `
      )
  )

  it(
    'formats with predicates',
    async () =>
      expect(
        await format(
          `
views {
  view {
    include    *  with{ }
    include * where tag = #test    with    {}
    include -> *  with{ }
    include -> * where tag = #test    with    {}
  }
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        views {
          view {
            include * with {
            }
            include * where tag = #test with {
            }
            include -> * with {
            }
            include -> * where tag = #test with {
            }
          }
        }"
      `
      )
  )

  it(
    'formats leaf properties',
    async () =>
      expect(
        await format(
          `
specification {
  element system {
    notation    'test'
    technology  'test'
  }
  relationship rel1 {
    notation    'test'
    technology  'test'
  }
}
model {
  system sys1 {
    title    'test'
    description'test'
    technology   'test'
  }
  sys1 -> sys2 {
    title'test'
    description    'test'
    technology    'test'
  }
}
views {
  view {
    title'test'
    description   'test'
    include * with {
      notation   'test'
      title     'test'
      description    'test'
      technology'test'   
    }
    include * -> * with {
      notation'test'
      title'test'
      description    'test'
      technology    'test'
    }
  }
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        specification {
          element system {
            notation 'test'
            technology 'test'
          }
          relationship rel1 {
            notation 'test'
            technology 'test'
          }
        }
        model {
          system sys1 {
            title 'test'
            description 'test'
            technology 'test'
          }
          sys1 -> sys2 {
            title 'test'
            description 'test'
            technology 'test'
          }
        }
        views {
          view {
            title 'test'
            description 'test'
            include
              * with {
                notation 'test'
                title 'test'
                description 'test'
                technology 'test'
              }
            include
              * -> * with {
                notation 'test'
                title 'test'
                description 'test'
                technology 'test'
              }
          }
        }"
      `
      )
  )

  it(
    'formats style leaf properties',
    async () =>
      expect(
        await format(
          `
specification {
  element system {
    style {
      color primary
      opacity   30%
      icon    aws:person
      shape   queue
      border     solid
    }
  }
  relationship rel1 {
    color    primary
    line  solid
    head    normal
    tail  normal
  }
}
model {
  system sys1 {
    style {
      color    primary
      opacity   30%
      icon    aws:person
      shape   queue
      border     solid
    }
  }
  sys1 -> sys2 {
    style {
      color     primary
      line  solid
      head    normal
      tail  normal
    }
  }
}
views {
  view {
    include * with {  
      color       primary
      opacity   30%
      icon    aws:person
      shape   queue
      border     solid
    }
    include * -> * with {
      color     primary
      line  solid
      head    normal
      tail  normal
    }
    style * {
      color     primary
      opacity   30%
      icon    aws:person
      shape   queue
      border     solid
    }
  }
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        specification {
          element system {
            style {
              color primary
              opacity 30%
              icon aws:person
              shape queue
              border solid
            }
          }
          relationship rel1 {
            color primary
            line solid
            head normal
            tail normal
          }
        }
        model {
          system sys1 {
            style {
              color primary
              opacity 30%
              icon aws:person
              shape queue
              border solid
            }
          }
          sys1 -> sys2 {
            style {
              color primary
              line solid
              head normal
              tail normal
            }
          }
        }
        views {
          view {
            include
              * with {
                color primary
                opacity 30%
                icon aws:person
                shape queue
                border solid
              }
            include
              * -> * with {
                color primary
                line solid
                head normal
                tail normal
              }
            style * {
              color primary
              opacity 30%
              icon aws:person
              shape queue
              border solid
            }
          }
        }"
      `
      )
  )

  it(
    'formats leaf properties with colon',
    async () =>
      expect(
        await format(
          `
specification {
  element system {
    notation  :    'test'   ;
    technology  :  'test'   ;
  }
  relationship rel1 {
    notation  :    'test'   ;
    technology  :  'test'   ;
  }
}
model {
  system sys1 {
    title  :    'test'   ;
    description  :'test'   ;
    technology  :   'test'   ;
  }
  sys1 -> sys2 {
    title  :'test'   ;
    description  :    'test'   ;
    technology  :    'test'   ;
  }
}
views {
  view {
    title  :'test'   ;
    description  :   'test'   ;
    include * with {
      notation  :   'test'   ;
      title  :     'test'   ;
      description  :    'test'   ;
      technology  :'test'   ;   
    }
    include * -> * with {
      notation  :'test'   ;
      title  :'test'   ;
      description  :    'test'   ;
      technology  :    'test'   ;
    }
  }
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        specification {
          element system {
            notation: 'test';
            technology: 'test';
          }
          relationship rel1 {
            notation: 'test';
            technology: 'test';
          }
        }
        model {
          system sys1 {
            title: 'test';
            description: 'test';
            technology: 'test';
          }
          sys1 -> sys2 {
            title: 'test';
            description: 'test';
            technology: 'test';
          }
        }
        views {
          view {
            title: 'test';
            description: 'test';
            include
              * with {
                notation: 'test';
                title: 'test';
                description: 'test';
                technology: 'test';
              }
            include
              * -> * with {
                notation: 'test';
                title: 'test';
                description: 'test';
                technology: 'test';
              }
          }
        }"
      `
      )
  )

  it(
    'formats style leaf properties with colon',
    async () =>
      expect(
        await format(
          `
specification {
  element system {
    style {
      color  : primary   ;
      opacity  :   30%   ;
      icon  :    aws:person   ;
      shape  :   queue   ;
      border  :     solid   ;
    }
  }
  relationship rel1 {
    color  :    primary   ;
    line  :  solid   ;
    head  :    normal   ;
    tail  :  normal   ;
  }
}
model {
  system sys1 {
    style {
      color  :    primary   ;
      opacity  :   30%   ;
      icon  :    aws:person   ;
      shape  :   queue   ;
      border  :     solid   ;
    }
  }
  sys1 -> sys2 {
    style {
      color  :     primary   ;
      line  :  solid   ;
      head  :    normal   ;
      tail  :  normal   ;
    }
  }
}
views {
  view {
    include * with {  
      color  :       primary   ;
      opacity  :   30%   ;
      icon  :    aws:person   ;
      shape  :   queue   ;
      border  :     solid   ;
    }
    include * -> * with {
      color  :     primary   ;
      line  :  solid   ;
      head  :    normal   ;
      tail  :  normal   ;
    }
    style * {
      color  :     primary   ;
      opacity  :   30%   ;
      icon  :    aws:person   ;
      shape  :   queue   ;
      border  :     solid   ;
    }
  }
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        specification {
          element system {
            style {
              color: primary;
              opacity: 30%;
              icon: aws:person;
              shape: queue;
              border: solid;
            }
          }
          relationship rel1 {
            color: primary;
            line: solid;
            head: normal;
            tail: normal;
          }
        }
        model {
          system sys1 {
            style {
              color: primary;
              opacity: 30%;
              icon: aws:person;
              shape: queue;
              border: solid;
            }
          }
          sys1 -> sys2 {
            style {
              color: primary;
              line: solid;
              head: normal;
              tail: normal;
            }
          }
        }
        views {
          view {
            include
              * with {
                color: primary;
                opacity: 30%;
                icon: aws:person;
                shape: queue;
                border: solid;
              }
            include
              * -> * with {
                color: primary;
                line: solid;
                head: normal;
                tail: normal;
              }
            style * {
              color: primary;
              opacity: 30%;
              icon: aws:person;
              shape: queue;
              border: solid;
            }
          }
        }"
      `
      )
  )

  it(
    'formats metadata',
    async () =>
      expect(
        await format(
          `
model {
  system sys1 {
    metadata {
      prop1    'some'
      prop2'other'
      prop3  :    'another'   ;
    }
  }
  sys1 -> sys2 {
    metadata {
      prop1    'some'
      prop2'other'
      prop3  :    'another'   ;
    }
  }
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        model {
          system sys1 {
            metadata {
              prop1 'some'
              prop2 'other'
              prop3: 'another';
            }
          }
          sys1 -> sys2 {
            metadata {
              prop1 'some'
              prop2 'other'
              prop3: 'another';
            }
          }
        }"
      `
      )
  )

  it(
    'formats autolayout property',
    async () =>
      expect(
        await format(
          `
views {
  view {
    autoLayout     TopBottom
  }
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        views {
          view {
            autoLayout TopBottom
          }
        }"
      `
      )
  )

  it(
    'formats link property',
    async () =>
      expect(
        await format(
          `
model {
  system sys1 {
    link   http://example.com
    link      http://example.com    'title'
    link  :   http://example.com   'title'   ;
  }
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        model {
          system sys1 {
            link http://example.com
            link http://example.com 'title'
            link: http://example.com 'title';
          }
        }"
      `
      )
  )

  it(
    'formats navigateTo property',
    async () =>
      expect(
        await format(
          `
views {
  view {
    include 
      * with {
        navigateTo    viewB
      }
  }
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        views {
          view {
            include
              * with {
                navigateTo viewB
              }
          }
        }"
      `
      )
  )

  it(
    'formats navigateTo property',
    async () =>
      expect(
        await format(
          `
views {
  view {
    style   *  ,sys1   ,   sys2 {
    } 
  }
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        views {
          view {
            style *, sys1, sys2 {
            }
          }
        }"
      `
      )
  )

  it(
    'formats element',
    async () =>
      expect(
        await format(
          `
model {
  system    sys1
  system    sys2   'title'  'description'   'tech'   'tag1, tag2'
  sys3=   system
  sys4 = system       'title'  'description'   'tech'   'tag1, tag2'
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        model {
          system sys1
          system sys2 'title' 'description' 'tech' 'tag1, tag2'
          sys3 = system
          sys4 = system 'title' 'description' 'tech' 'tag1, tag2'
        }"
      `
      )
  )

  it(
    'formats tags',
    async () =>
      expect(
        await format(
          `
model {
  system sys1 {
    #tag1    #tag2,   #tag3,#tag4, #tag5     #tag6
  }
}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        model {
          system sys1 {
            #tag1 #tag2, #tag3, #tag4, #tag5 #tag6
          }
        }"
      `
      )
  )

  it(
    'preserves empty lines',
    async () =>
      expect(
        await format(
          `
model {

  system sys1

  system sys2 {

    description 'some'

    metadata
  }

}`
        )
      ).toMatchInlineSnapshot(
        `
        "
        model {

          system sys1

          system sys2 {

            description 'some'

            metadata
          }

        }"
      `
      )
  )
})

async function format(source: string) {
  const { format } = createTestServices()

  return await format(source)
}
