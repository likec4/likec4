export const TutorialExample = {
  currentFilename: 'tutorial.c4',
  files: {
    ['tutorial.c4']: `
// Tutorial:
// https://likec4.dev/tutorial/

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
        icon tech:nextjs
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
  customer -> saas 'enjoys our product'
}

views {

  view index {
    title 'Landscape view'

    include *
  }

  view saas of saas {
    include *

    style * {
      opacity 25%
    }
    style customer {
      color muted
    }
  }

}
`.trimStart()
  }
}
