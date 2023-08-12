import type { FilesStore } from '../atoms'

export const GettingStartedPlayground = {
  current: 'file:///getting-started.c4',
  files: {
    'file:///getting-started.c4': `
// Tutorial:
// https://likec4.dev/docs/#tutorial

specification {
  element actor
  element system
  element component
}

model {
  customer = actor 'Customer' {
    description 'The regular customer of the system'
  }

  saas = system 'Our SaaS' {
    component ui 'Frontend' {
      description 'Nextjs application, hosted on Vercel'
      style {
        shape browser
      }
    }
    component backend 'Backend Services' {
      description '
        Implements business logic
        and exposes as REST API
      '
    }

    // UI requests data from the Backend
    ui -> backend 'fetches via HTTPS'
  }

  // Customer uses the UI
  customer -> ui 'opens in browser'
}

views {

  view index {
    title 'Landscape view'

    include *
  }

  view saas of saas {
    include *

    style customer {
      color muted
    }
  }

}
`.trimStart()
  }
} satisfies FilesStore
