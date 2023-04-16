const model = `
specification {
  element component
}
model {
  component user
  component system {
    component backend {
      component model
      component api
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
export const valid_07_View =
  model +
  `
views {
  view index {
    include *
  }
}
`
export const valid_07_ViewOf =
  model +
  `
views {
  view index of system.backend {
    include *
  }
}
`
export const valid_07_ViewRules =
  model +
  `
views {
  view {
    include *,
      infra.*,
      backend.*
    exclude frontend
  }
}
`
// Two api: in backend and auth
export const invalid_07_ViewRules_Inambiqutes =
  model +
  `
views {
  view of system {
    include api
  }
}
`
export const valid_07_ViewRules_IncludeScopeOf =
  model +
  `
views {
  view of system.backend {
    include api, auth.api
  }
}
`

export const valid_07_ViewProperties =
  model +
  `
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

export const valid_07_ViewRules_Relations =
  model +
  `
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

export const valid_07_ViewStyleRules =
  model +
  `
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

export const invalid_07_ViewStyleRules =
  model +
  `
views {
  view {
    include *
    style backend, {
      color muted
    }
  }
}
`

export const valid_07_ViewLayoutRules =
  model +
  `
views {
  view {
    include *
    style * {
      color: secondary
    }
    autoLayout TB
    exclude -> frontend
  }
}
`
