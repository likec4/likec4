import { describe, vi } from 'vitest'
import { test } from './asserts'

const model = `
  specification {
    element component
    tag epic-123
    tag next
  }
  model {
    component user
    component system {
      component backend {
        component model
        component api {
          #next
        }
      }
      component auth {
        component api
      }
      component frontend
    }
    component infra {
      component database
    }

    backend.model -> infra.database
    backend.api -> backend.model
    auth.api -> backend.api
    frontend -> auth.api
    frontend -> backend.api
    user -> frontend
  }
`

describe.concurrent('views', () => {
  test('valid index').valid`${model}
    views {
      view index {
        include *
      }
    }`

  test('view of').valid`${model}
    views {
      view index of system.backend {
        include *
      }
    }`

  test('extends without names').valid`${model}
    views {
      view index {
        include *
      }
      view extends index {
        include *
      }
      view extends index {
        include *
      }
    }`

  test('extends without name').valid`${model}
    views {
      view index {
        include *
      }
      view index2 extends index {
        include *
      }
      view index3 extends index {
        include *
      }
    }`

  test('extends from view of').valid`${model}
    views {
      view index of system.backend {
        include *
      }
      view extends index {
        include *
      }
      view index2 extends index {
        include *
      }
    }`

  test('chained extends').valid`${model}
    views {
      view index {
        include *
      }
      view index2 extends index {
        include *
      }
      view index3 extends index2 {
        include *
      }
    }`

  test('view properties: title, link, description').valid`${model}
    views {
      view index {
        title 'Index'
        description: "
          Index view description
        ";
        link https://domain.com/path

        include *
      }
    }`

  test('view tags').valid`${model}
    views {
      view index {
        #epic-123 #next
        title "Index";
        include *
      }
    }`

  test('viewRules').valid`${model}
    views {
      view {
        include *,
          infra.*,
          backend.*
        exclude frontend
      }
    }`

  test('viewRules: element.kind and element.tag').valid`${model}
    views {
      view {
        include *,
          element.kind = component,
          element.kind != component
        exclude
          element.tag == #next,
          element.tag != #next
      }
    }`

  // Two api: in backend and auth
  test('viewRules inambiqutes').invalid`${model}
    views {
      view {
        include api
      }
    }`
  test('viewRules inambiqutes "of"').invalid`${model}
    views {
      view of system {
        include api
      }
    }`

  // api is resolved from "of"
  test('viewRules resolve reference to "of" ').valid`${model}
    views {
      view of backend.api {
        include api
      }
    }
    `

  test('viewRules IncludeScopeOf').valid`${model}
    views {
      view of system.backend {
        include api
        include auth.api
      }
    }
    `

  test('ViewProperties').valid`${model}
    views {
      view {
        title 'User view'
        description "
          View description
        "
        include *
        exclude -> user
      }
    }
    `

  test('ViewRules Relations').valid`${model}
    views {
      view {
        include
          -> backend,
          -> backend.*,
          -> backend ->,
          -> backend.* ->,
          backend ->,
          backend.* ->
        exclude
          * -> infra,
          * -> infra.*,
          * -> *
      }
    }
    `

  test('ViewStyleRules - valid').valid`${model}
    views {
      view {
        include *
        style * {
          color: secondary
        }
        style backend, infra {
          color: muted
        }
        exclude -> frontend
      }
    }
    `

  test('ViewStyleRules - with icon').valid`${model}
    views {
      view {
        include *
        style backend, infra {
          icon https://icons.terrastruct.com/dev%2Ftypescript.svg
        }
      }
    }`

  test('global ViewStyleRules - valid').valid`${model}
    views {
      style * {
        color: secondary
      }
      view {
        include *
        exclude -> frontend
      }
      style backend, infra {
        color: muted
      }
    }
    `

  test('trailing comma in predicates').valid`${model}
    views {
      view {
        include
          -> backend,
          -> backend.*,
        exclude
          * -> infra,
          * -> infra.*,
      }
    }
  `

  test('trailing comma in style rule').valid`${model}
    views {
      view {
        include *
        style backend, {
          color muted
        }
      }
    }
  `

  test('autoLayout').valid`${model}
    views {
      view {
        include *
        style * {
          color: secondary
        }
        autoLayout BottomTop
        exclude -> frontend
      }
      view {
        autoLayout LeftRight
        include *
      }
    }`
})
