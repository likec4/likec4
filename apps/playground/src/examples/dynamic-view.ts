export const DynamicViewExample = {
  currentFilename: 'dynamic.c4',
  files: {
    ['specs.c4']: `
specification {
  element actor {
    notation "Person, Customer"
    style {
      shape person
    }
  }
  element system {
    notation "Software system"
    style {
      opacity 35%
      color secondary
    }
  }
  element component {
    style {
      opacity 25%
      border none
      color secondary
    }
  }
  element database {
    notation "Relational Database"
    style {
      shape storage
      color muted
    }
  }
  element redis {
    notation "Redis"
    style {
      icon tech:redis
      shape storage
      color muted
    }
  }
}
`.trimStart(),
    ['dynamic.c4']: `
model {
  customer = actor 'Customer' {
    description 'Customer of Cloud System'
  }

  cloud = system 'Cloud System' {


    backend = component 'Backend' {
      description 'Backend services and API'

      auth = component 'Authentication' {
        description 'Self-Hosted Authentication Service'
      }

      api = component 'Backend API' {
        description 'Java Spring Web-service
        provides access via REST API'
      }

      api -> auth 'validates bearer token'
    }

    ui = component 'Frontend' {
      description '
        All the frontend applications
        of Cloud System
      '
      style {
        shape browser
      }

      web = component 'Customer Dashboard' {
        technology 'React, Typescript'
        description 'Browser Single-Page Application'
        style {
          shape browser
        }
      }

      web -> auth
      web -> api 'requests'
    }

    db = database 'Database' {
      description 'PostgreSQL Database'
      icon tech:postgresql
    }

    cache = redis "Redis Cache"
  }

  customer -> web 'opens in browser'
}

// What diagrams to generate
views {

  dynamic view index {
    title 'Dynamic View Example'
    ui -> api {
      notes '
        🏛️ - Requests data using predefined GraphQL queries
        ( ONLY )

        🤖 - Queries regression on CI
      '
    }
    parallel {
      api -> cache {
        notes "
          First, API checks if data is cached already.
          Second, is it stale?
        "
      }
      api -> db {
        notes "If no data cached, queries persistent data  (SQL)"
      }

    }
    include
      cloud,
      ui with {
        color secondary
        icon tech:react
      },
      api with {
        color secondary
        icon tech:graphql
    }


    style cloud {
      color muted
      opacity 20%
    }
    autoLayout TopBottom
  }

  view customer of customer {
    include
      customer,
      cloud,
      web

    style cloud {
      opacity 25%
      color muted
    }
    style cloud.* {
      color green
    }
  }

  view cloud of cloud {
    include *
  }

  view ui of ui {
    include cloud, *
  }

  view backend of backend {
    include cloud, *

    style cloud, backend {
      opacity 0%
      border dashed
      color muted
    }
  }

  view web of web {
    include *, cloud, backend._
    exclude ui


    style cloud, backend {
      opacity 0%
      border dashed
      color muted
    }
  }

  dynamic view example {
    title 'Dynamic View Example'
    customer -> web
    web -> auth 'updates bearer token if needed'
    web -> api 'POST request'
    api -> auth 'validates bearer token'
    api -> api 'process request'
    web <- api 'returns JSON'
    include cloud, ui, backend

    style cloud {
      color muted
      opacity 0%
    }
    style ui._ {
      color green
    }
  }
}
`.trimStart()
  }
}
