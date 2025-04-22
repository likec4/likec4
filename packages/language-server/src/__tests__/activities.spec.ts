import { describe } from 'vitest'
import { test } from './asserts'

describe.concurrent('activities', () => {
  test('element with activities (empty)').valid`
    specification {
      element component
    }
    model {
      component system1 {
        activity Activity1
      }
    }`

  test('element with activities (not empty)').valid`
    specification {
      element component
    }
    model {
      component system1 {
        activity Activity1 {
        }

        component component1 {
          activity Activity1 {
          }
        }
      }
    }`

  test('element with activity props').valid`
    specification {
      element component
    }
    model {
      component system1 {
        activity Activity1 {
          title 'Activity1'
        }
      }
    }`

  test('element with duplicate activity').invalid`
    specification {
      element component
    }
    model {
      component system1 {
        activity Activity1
        activity Activity1
      }
    }`

  test('element with activity steps').valid`
    specification {
      element component
    }
    model {
      component system1 {
        activity Activity1 {
          -> system2
        }
      }
      component system2
    }`

  test('element with activity steps to another activity').valid`
    specification {
      element component
    }
    model {
      component system1 {
        activity Activity1 {
          -> system2.Activity1
        }
      }
      component system2 {
        activity Activity1
      }
    }`
})
