import { describe } from 'vitest'
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
describe('07_View', () => {
  test('view').valid`${model}
      views {
        view index {
          include *
        }
      }
      `

  test('viewOf').valid`${model}
    views {
      view index of system.backend {
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
            element.tag = #next,
            element.tag != #next
        }
      }
      `

  // Two api: in backend and auth
  test('viewRules inambiqutes').invalid`${model}
      views {
        view of system {
          include api
        }
      }
      `

  test('viewRules IncludeScopeOf').valid`${model}
      views {
        view of system.backend {
          include api, auth.api
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

  test('ViewStyleRules - invalid').invalid`${model}
      views {
        view {
          include *
          style backend, {
            color muted
          }
        }
      }
      `

  test('ViewLayoutRules').valid`${model}
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
