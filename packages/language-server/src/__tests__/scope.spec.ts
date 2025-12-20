import { describe, vi } from 'vitest'
import { test } from './asserts'

describe.concurrent('scope', () => {
  test('valid').valid`
    specification {
      element person
      element component
    }
    model {
      person user
      component system {
        component subsystem {
          -> backend
        }
        backend = component {
          api = component 'API'
        }
        user -> api
      }
    }`

  test('valid for elements with names "aws"/"azure"/"tech"').valid`
    specification {
      element component
      element element
    }
    model {
      system = component {
        aws = element {
          rds = element 'RDS'
        }
        azure = element
        tech = element {
          nodejs = element 'Node.js'
        }
      }
      azure -> aws.rds
      tech.nodejs -> aws.rds
    }`

  test('fail if duplicate name in scope').invalid`
    specification {
      element person
      element component
    }
    model {
      person user
      component system {
        component subsystem {
        }
        backend1 = component {
          api = component 'API 1'
        }
        backend2 = component {
          api = component 'API 2'
        }
        user -> api
      }
    }`
})

  test('scope resolution with nested elements').valid`
    specification {
      element component
      element service
    }
    model {
      component system {
        service api {
          component backend
        }
        component frontend
      }
      frontend -> api.backend
    }`

  test('scope resolution with deployment nodes').valid`
    specification {
      element component
      deployment node server
    }
    model {
      component app
    }
    deployment prod {
      node cluster {
        node vm1 {
          instance = app
        }
      }
    }`

  test('scope resolution for FqnRef with parent reference').valid`
    specification {
      element component
    }
    model {
      component system {
        component api {
          component users
          component posts
        }
        component ui
      }
      ui -> api.users
      ui -> api.posts
    }`

  test('scope resolution with imported elements').valid`
    specification {
      element component
    }
    model {
      component external {
        component service
      }
    }
    model {
      import external.*
      component internal
      internal -> service
    }`

  test('scope resolution with extend element').valid`
    specification {
      element component
    }
    model {
      component system {
        component api
      }
    }
    model {
      extend system.api {
        component handler
      }
      component client
      client -> handler
    }`

  test('scope resolution in element view body').valid`
    specification {
      element component
    }
    model {
      component system {
        component api
        component db
      }
      api -> db
    }
    views {
      view index {
        include *
        element api {
          notation 'API Service'
        }
      }
    }`

  test('fail scope resolution for non-existent parent').invalid`
    specification {
      element component
    }
    model {
      component system {
        component api
      }
      component external
      external -> nonexistent.api
    }`

  test('scope resolution with multiple levels of nesting').valid`
    specification {
      element component
    }
    model {
      component org {
        component dept {
          component team {
            component project {
              component module
            }
          }
        }
      }
      component external
      external -> org.dept.team.project.module
    }`

  test('scope resolution with deployment and instances').valid`
    specification {
      element component
      deployment node server
    }
    model {
      component app {
        component api
      }
    }
    deployment prod {
      node web {
        inst1 = app
      }
    }
    views {
      view deploymentView of prod {
        include *
      }
    }`

  test('scope resolution with strict FqnRef').valid`
    specification {
      element component
    }
    model {
      component root {
        component child1 {
          component grandchild
        }
        component child2
      }
      child2 -> root.child1.grandchild
    }`

  test('scope resolution should handle imported deployment nodes').valid`
    specification {
      element component
      deployment node server
    }
    model {
      component service
    }
    deployment infra {
      node datacenter {
        node rack1
      }
    }
    deployment prod {
      import infra.*
      node cluster {
        rack1
      }
    }`
