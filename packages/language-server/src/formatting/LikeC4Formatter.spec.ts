import { describe, expect, it } from 'vitest'
import { createTestServices } from '../test'

describe('formating', () => {
  describe('formats specification', () => {
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
  deploymentNode    node{}
}`,
          ),
        ).toMatchInlineSnapshot(
          `
        "
        specification {
          element el

          relationship rel

          tag tag1
          color custom #123456
          deploymentNode node {
          }
        }"
      `,
        ),
    )
  })

  describe('formats globals', () => {
    it(
      'formats syles and styleGroups',
      async () =>
        expect(
          await format(
            `
  global{
  style    global-style    *,   some{
  color red
  notation 'some description'
  }
  styleGroup    global-style-group{
  style    *,other   {
  opacity 20%
  }
  }
  }`,
          ),
        ).toMatchInlineSnapshot(
          `
          "
          global {
            style global-style *, some {
              color red
              notation 'some description'
            }
            styleGroup global-style-group {
              style *, other {
                opacity 20%
              }
            }
          }"
        `,
        ),
    )

    it(
      'formats predicate groups',
      async () =>
        expect(
          await format(
            `
  global{
  predicateGroup    global-predicate-group{
  include    *  ,   some.*
  include *->*
  }
  dynamicPredicateGroup    global-dynamic-predicate-group{
  include    *  ,   some.*
  }
  }`,
          ),
        ).toMatchInlineSnapshot(`
          "
          global {
            predicateGroup global-predicate-group {
              include *, some.*
              include * -> *
            }
            dynamicPredicateGroup global-dynamic-predicate-group {
              include *, some.*
            }
          }"
        `),
    )
  })

  describe('formats model', () => {
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
}`,
          ),
        ).toMatchInlineSnapshot(
          `
        "
        model {
          system sys1
          system sys2 'title' 'description' 'tech' 'tag1, tag2'
          sys3 = system
          sys4 = system 'title' 'description' 'tech' 'tag1, tag2'
        }"
      `,
        ),
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
  }`,
          ),
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
        `,
        ),
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
  }`,
          ),
        ).toMatchInlineSnapshot(
          `
          "
          specification {
            element el
          }
          model {
            el sys1 'test'
          }"
        `,
        ),
    )
  })

  describe('formats deployments', () => {
    it(
      'formats node declarations',
      async () =>
        expect(
          await format(
            `
  deployment{
  node   zone1    {
  instanceOf test
  }
  node   zone2    'zone2'    {
  cluster=node{
  }
  }
  }`,
          ),
        ).toMatchInlineSnapshot(`
          "
          deployment {
            node zone1 {
              instanceOf test
            }
            node zone2 'zone2' {
              cluster = node {
              }
            }
          }"
        `),
    )

    it(
      'formats instance declarations',
      async () =>
        expect(
          await format(
            `
  deployment{
  node   zone1    {
  instanceOf    test
  instanceOf test2{
  title    'test2'
  }
  testInst=   instanceOf    test
  }
  }`,
          ),
        ).toMatchInlineSnapshot(`
          "
          deployment {
            node zone1 {
              instanceOf test
              instanceOf test2 {
                title 'test2'
              }
              testInst = instanceOf test
            }
          }"
        `),
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
    deploymentNode node
    tag tag1
  }
  model {
    component system1
  }
  deployment {
    node zone1 {
      instance1 = instanceOf system1
    }
    node zone2 {
      node cluster {
        instance2 = instanceOf system1

        zone2.cluster.instance2   ->     zone1.instance1
        zone2.cluster.instance2   ->zone1.instance1
        zone2.cluster.instance2   -[   http   ]->   zone1.instance1
        zone2.cluster.instance2  .http   zone1.instance1   'title'  'REST'  #tag1
      }
    }
    zone1.instance1    ->zone2.cluster.instance2   {
    }
  }`,
          ),
        ).toMatchInlineSnapshot(
          `
          "
          specification {
            element component
            relationship http
            deploymentNode node
            tag tag1
          }
          model {
            component system1
          }
          deployment {
            node zone1 {
              instance1 = instanceOf system1
            }
            node zone2 {
              node cluster {
                instance2 = instanceOf system1

                zone2.cluster.instance2 -> zone1.instance1
                zone2.cluster.instance2 -> zone1.instance1
                zone2.cluster.instance2 -[http]-> zone1.instance1
                zone2.cluster.instance2 .http zone1.instance1 'title' 'REST' #tag1
              }
            }
            zone1.instance1 -> zone2.cluster.instance2 {
            }
          }"
        `,
        ),
    )
  })

  describe('formats views', () => {
    it(
      'formats include/exclude expressions',
      async () =>
        expect(
          await format(
            `
  specification {
    element el
    deploymentNode node
  }
  model {
    el test
    el test1
    el test2
    el test3
  }
  deployment {
    node prod {
      instanceOf test
      instanceOf test1
      instanceOf test2
      instanceOf test3
    }
  }
  views {
    view index {
      include      test , test.*
      include      test1 
      , test2.*, test3
      include *   ,    * -> *  ,  * ->
      exclude * ,   * -> *, * ->
    }
    deployment   view    prod  {
      include     test  , test.*
      include      test1 
      , test2.*, test3      
      include *   ,    * -> *  ,  * ->
      exclude * ,   * -> *, * ->
    }
  }`,
          ),
        ).toMatchInlineSnapshot(`
          "
          specification {
            element el
            deploymentNode node
          }
          model {
            el test
            el test1
            el test2
            el test3
          }
          deployment {
            node prod {
              instanceOf test
              instanceOf test1
              instanceOf test2
              instanceOf test3
            }
          }
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
            deployment view prod {
              include test, test.*
              include
                test1,
                test2.*,
                test3
              include *, * -> *, * ->
              exclude *, * -> *, * ->
            }
          }"
        `),
    )

    it('formats relation predicates', async () => {
      expect(await format(`
views {
  deployment view index {
    include    ->   test
    include ->   test   ->
    include test   <->
    include test   -[  http  ]->
    include test   .http
    include test   ->
    include test   ->  test2
  }
}        
`)).toMatchInlineSnapshot(`
  "
  views {
    deployment view index {
      include -> test
      include -> test ->
      include test <->
      include test -[http]->
      include test .http
      include test ->
      include test -> test2
    }
  }        
  "
`)
    })

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
}`,
          ),
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
      `,
        ),
    )

    

    it(
      'formats where expression v2',
      async () =>
        expect(
          await format(
            `
views {
  deployment view index {
    include * where    tag==#tag1 
       or(tag!=#tag1   and   kind    is   not    kind1)
    and   not  tag   is   #tag1
    include *->* where    tag==#tag2 
       or(tag!=#tag2   and   kind    is   not    kind2)
    and   not  tag is   #tag2
  }
}`,
          ),
        ).toMatchInlineSnapshot(
          `
        "
        views {
          deployment view index {
            include
              * where tag == #tag1 or (tag != #tag1 and kind is not kind1) and not tag is #tag1
            include
              * -> * where tag == #tag2 or (tag != #tag2 and kind is not kind2) and not tag is #tag2
          }
        }"
      `,
        ),
    )

    it(
      'formats global style references',
      async () =>
        expect(
          await format(
            `
  views {
  view {
  global    style     global-style
  }
  dynamic view view-dynamic {
  global    style     global-style
  }
  }`,
          ),
        ).toMatchInlineSnapshot(
          `
          "
          views {
            view {
              global style global-style
            }
            dynamic view view-dynamic {
              global style global-style
            }
          }"
        `,
        ),
    )

    it(
      'formats global predicate references',
      async () =>
        expect(
          await format(
            `
  views {
  view {
  global    predicate     global-predicate
  }
  dynamic view view-dynamic {
  global    predicate     global-predicate
  }
  }`,
          ),
        ).toMatchInlineSnapshot(
          `
          "
          views {
            view {
              global predicate global-predicate
            }
            dynamic view view-dynamic {
              global predicate global-predicate
            }
          }"
        `,
        ),
    )

    it(
      'formats styles',
      async () =>
        expect(
          await format(
            `
  views {
    view {
      style   *  ,sys1   ,   sys2 {
      } 
    }
    deployment view prod {
      style   *  ,sys1   ,   sys2 {
      }
    }
  }`,
          ),
        ).toMatchInlineSnapshot(
          `
          "
          views {
            view {
              style *, sys1, sys2 {
              }
            }
            deployment view prod {
              style *, sys1, sys2 {
              }
            }
          }"
        `,
        ),
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
    deployment     view  view4  {
    }
  }`,
          ),
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
            deployment view view4 {
            }
          }"
        `,
        ),
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
  }`,
          ),
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
        `,
        ),
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
    view {
      autoLayout     TopBottom   123   321
    }
  }`,
          ),
        ).toMatchInlineSnapshot(
          `
          "
          views {
            view {
              autoLayout TopBottom
            }
            view {
              autoLayout TopBottom 123 321
            }
          }"
        `,
        ),
    )

    it(
      'formats groups',
      async () =>
        expect(
          await format(
            `
  views {
    view {
  group   "group1"{
  color    red
  border    solid
  opacity   10%
  include    *  with{ }
  include * where tag = #test    with    {}    
  group   "nested-group"{
  }
  }
    }
  view {
  group   "group3"{
  color  :    red ;
  border  :    solid ;
  opacity  :   10% ;
  }
  }
  }`,
          ),
        ).toMatchInlineSnapshot(
          `
          "
          views {
            view {
              group "group1" {
                color red
                border solid
                opacity 10%
                include * with {
                }
                include * where tag = #test with {
                }
                group "nested-group" {
                }
              }
            }
            view {
              group "group3" {
                color: red;
                border: solid;
                opacity: 10%;
              }
            }
          }"
        `,
        ),
    )
  })

  describe('common formatting', () => {
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
}`,
          ),
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
      `,
        ),
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
}`,
          ),
        ).toMatchInlineSnapshot(
          `
        "
        views {
          view index {
            include *
          }
        }"
      `,
        ),
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
  }`,
          ),
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
        `,
        ),
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
}`,
          ),
        ).toMatchInlineSnapshot(
          `
        "
        model {
          system sys1 {
            #tag1 #tag2, #tag3, #tag4, #tag5 #tag6
          }
        }"
      `,
        ),
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
}`,
          ),
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
      `,
        ),
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
  }`,
          ),
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
        `,
        ),
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
  }`,
          ),
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
        `,
        ),
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
        multiple     true
        size     xs
        padding     small
        textSize     md
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
  }`,
          ),
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
                multiple true
                size xs
                padding small
                textSize md
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
        `,
        ),
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
    system sys1 {
      title: 'test';
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
  }`,
          ),
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
            system sys1 {
              title: 'test';
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
        `,
        ),
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
  }`,
          ),
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
        `,
        ),
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
  }`,
          ),
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
        `,
        ),
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
  }`,
          ),
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
        `,
        ),
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
  }`,
          ),
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
        `,
        ),
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
  }`,
          ),
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
        `,
        ),
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
  
  }`,
          ),
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
        `,
        ),
    )

    it('is idempotent', async () => {
      const source = `
  specification {
    color custom #6BD731
  
    element actor {
      notation "Person"
      style {
        shape person
      }
    }
    element system
    element externalSystem {
      notation "External System"
      style {
        color secondary
        opacity 10%
      }
    }
  
    element containe
    element app {
      notation "Application"
    }
    element component
    element mobileApp {
      notation "Mobile Application"
      style {
        shape mobile
        icon tech:swift
        //icon https://icon.icepanel.io/Technology/svg/Swift.svg
      }
    }
  
    relationship uses
    relationship requests
  }
  global {
    style global-style *, some {
      color red
      notation 'some description'
    }
    styleGroup global-style-group {
      style *, other {
        opacity 20%
      }
    }
  }
  model {
    customer = actor 'Cloud System Customer' {
      description '
        The regular customer of the system
      '
    }
  
    cloud = system 'Cloud System' {
      description '
        Our SaaS platfrom that allows
        customers to interact with
        the latest technologies
      '
  
      ui = container 'Frontends' {
        description '
          All the frontend applications
          of Cloud System
        '
        metadata {
          version '2.1.1'
        }
      }
  
      legacy = container 'Cloud Legacy' {
        description '
          The legacy version of our SaaS
          MVP as was presented to the first customers
        '
        link ./.github/workflows/update-diagrams.yml#L19-L25 'L19-L25'
      }
  
      next = container 'Cloud Next' {
        description 'Cloud Next is the next version of our cloud systems'
      }
  
      supportUser = actor 'Support User' {
        description '
          A emploere from the support team
          Has limited access to the system
        '
        -> customer 'helps with questions' {
          metadata {
            rps '1000'
          }
        }
      }
    }
    customer .uses cloud 'uses and pays' {
      navigateTo dynamic-view-1
    }
  
  }
  
  views {
    view index {
      title "Landscape"
      include
        customer, // include first
        *
    }
  
    view customer of customer {
      include
        *,
        customer -> cloud.ui with {
          color red
        },
        supportUser
  
      global style global-style
  
      style supportUser {
        color: indigo;
      }
    }
  
    view groupped {
      group "group1" {
        include customer, cloud
  
        group "group2" {
          color green
        }
      }
    }
  
    dynamic view dynamic-view-1 {
      title 'Dynamic View Example'
  
      link https://docs.likec4.dev/dsl/dynamic-views/ 'Docs'
  
      customer -> ui.dashboard 'opens'
      ui.dashboard -> cloud.graphql 'requests'
      ui.dashboard <- cloud.graphql 'returns'
  
      ui.mobile -> cloud.graphql 'requests'
      ui.mobile <- cloud.graphql
  
      include cloud
  
      autoLayout TopBottom
      style * {
        color secondary
      }
      style cloud {
        opacity 40%
        color muted
      }
    }
  }`
      const stage1 = await format(source)
      const stage2 = await format(stage1)

      expect(stage1).toBe(stage2)
    })
  })
})

async function format(source: string) {
  const { format, validate } = createTestServices()

  // const validationResult = await validate(source)
  // if(validationResult.errors.length > 0 || validationResult.warnings.length > 0) {
  //   return validationResult.warnings.join('\n')
  // }

  return await format(source)
}
