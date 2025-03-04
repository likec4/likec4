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
      border none
    }
  }
  element component {
    style {
      color secondary
      opacity 35%
      border none
    }
  }
  element storage {
    notation "Data storage"
    style {
      color secondary
      opacity 35%
      shape storage
      border none
    }
  }
  element database {
    notation "Relational Database"
    style {
      color secondary
      shape storage
    }
  }
  element redis {
    notation "Redis"
    style {
      color secondary
      icon tech:redis
      shape storage
    }
  }
}\
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
      auth -> cache 'keeps active sessions'

      api = component 'Backend API' {
        technology 'java/spring'
        description '
          Java Spring Web-service
          provides access via REST API
        '
      }

      api -> auth 'validates bearer token'
      api -> db 'requests persistent data'
      api -> cache 'requests session data'
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
          icon tech:react
          shape browser
        }
      }

      web -> auth 'refreshes token' {
        navigateTo authTokenUpdateFlow
      }
      web -> api 'requests data' {
        navigateTo index
      }
    }

    storage  = storage 'Data Stores' {
      description 'Provides access to data'

      db = database 'Persistent Data' {
        description 'Relational Database'
        icon tech:postgresql
      }

      cache = redis 'Session Data' {
        description 'Storage with temporary, session-only data'
      }
    }
  }

  customer -> web 'opens in browser'
}

views {

  dynamic view index {
    title 'Story 1.1 - User dashboard'

    customer -> web '' {
      notes '
        Opens application in the browser via secured connection, authenticates and navigates to the dashboard
      '
    }

    web -> auth 'updates token if needed' {
      navigateTo authTokenUpdateFlow
      notes '
        Frontend application checks access token expiration.
        If expired - requests a new using refresh token
      '
    }

    web -> api 'GET request' {
      notes 'Requests data from API endpoint with access token'
    }
    // Validates token
    api -> auth {
      notes '
        API verifies token and receives users identification if token is valid

        If token is not valid, returns HTTP 403
      '
    }

    parallel {
      api -> db '' {
        notes 'Queries persistent data from database'
      }
      api -> cache '' {
        notes 'Reads session data'
      }
    }

    api -> api 'process' {
      notes 'Transforms data and prepares user dashboard'
    }
    web <- api {
      notes 'Returns data to frontend as JSON'
    }

    include cloud, storage

    style cloud._ {
      color secondary
      opacity 30%
    }
  }

  view customer of customer {
    include
      customer,
      cloud,
      ui

    style cloud {
      opacity 40%
      color secondary
    }
    style cloud.* {
      color secondary
    }
  }

  view cloud of cloud {
    include *
    autoLayout LeftRight
  }

  view ui of ui {
    include
      *,
      backend._,
    exclude
      api -> auth
  }

  view backend of backend {
    include
      cloud,
      *,
      backend.* -> storage with {
        title ''
      }

    style cloud, backend {
      opacity 40%
      color muted
    }
    style backend._ {
      color green
    }
  }

  view storage of storage {
    include
      *,
      backend._
  }

  dynamic view authTokenUpdateFlow {
    title 'Auth token update'
    customer -> web 'interacts'
    web -> auth {
      notes '
        Frontend application checks access token expiration.
        If expired - requests a new using refresh token
      '
    }
    auth -> cache 'lookups' {
      notes '
        Lookups for refresh token
      '
    }
    auth -> auth {
      notes '
        Validates refresh token, issues new access token
      '
    }
    parallel {
      auth -> cache 'stores' {
        notes '
          Updates refresh token and stores a new issued access token
        '
      }
      web <- auth 'returns tokens' {
        notes '
          Returns updated refresh token and new acess token,
        '
      }
    }
    web -> web {
      notes '
        Stores tokens in localStorage
      '
    }

    include cloud._

    style customer, cloud._ {
      color secondary
      opacity 40%
    }
  }
}
`.trimStart(),
  },
}
