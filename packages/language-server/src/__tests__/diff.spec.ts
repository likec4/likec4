import { describe } from 'vitest'
import { test } from './asserts'

describe('diff keywords', () => {
  test('are valid names where they were valid before').valid`
    specification {
      element component
      color add #add
      color remove #fff
    }
    model {
      diff = component {
        style {
          color add
        }
      }
      add = component
      remove = component
    }
    global {
      predicateGroup remove {
        include *
      }
      styleGroup diff {
        style * {
          color remove
        }
      }
      style add * {
        color add
      }
    }
    views {
      view index {
        global predicate remove
        global style diff
        global style add
      }
    }
  `
})

const diffViewsModel = `
  specification {
    element system
    element container
  }
  model {
    shop = system 'Online Shop' {
      orders = container 'Order Service'
      gateway = container 'Payment Gateway'
    }
    bank = system 'Bank'
    shop.orders -> shop.gateway 'charges'
    shop.gateway -> bank 'calls API'
  }
`

describe('diff views', () => {
  test('navigateTo a view of the same diff').valid`
    ${diffViewsModel}
    diff rfc1 'RFC-1' {
      add {
        extend shop {
          auth = container 'Auth Service'
        }
      }
      views {
        dynamic view checkout {
          shop.orders -> shop.auth 'get token'
        }
        dynamic view checkoutFailure {
          shop.orders -> shop.auth 'get token' {
            navigateTo checkout
          }
        }
      }
    }
  `

  test('navigateTo a view of another diff').invalid`
    ${diffViewsModel}
    diff rfc1 {
      views {
        dynamic view checkout {
          shop.orders -> shop.gateway
        }
      }
    }
    diff rfc2 {
      views {
        dynamic view checkoutFailure {
          shop.orders -> shop.gateway {
            navigateTo checkout
          }
        }
      }
    }
  `

  test('navigateTo a diff view from a top-level view').invalid`
    ${diffViewsModel}
    diff rfc1 {
      views {
        dynamic view checkout {
          shop.orders -> shop.gateway
        }
      }
    }
    views {
      dynamic view index {
        shop.orders -> shop.gateway {
          navigateTo checkout
        }
      }
    }
  `
})
