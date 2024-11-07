import { describe, vi } from 'vitest'
import { test } from './asserts'

describe.concurrent('model', () => {
  test('name on the right side').valid`
    specification {
      element person
    }
    model {
      person user1
      person user2
    }`

  test('name on the left side').valid`
    specification {
      element person
    }
    model {
      user1 = person
      user2 = person
    }`

  test('allow element with kind "element"').valid`
    specification {
      element element
    }
    model {
      element el1
      element el2
    }`

  test('allow element with kind "model"').valid`
    specification {
      element model
    }
    model {
      model el1
      el2 = model
    }`

  test('allow elements with names "aws"/"azure"/"tech"').valid`
    specification {
      element element
    }
    model {
      aws = element
      azure = element
      tech = element
    }`

  test('allow element with names "aws"/"azure"/"tech" (2) ').valid`
    specification {
      element element
    }
    model {
      element aws
      element azure
      element tech
    }`

  test('disallow element with name "this"').invalid`
    specification {
      element person
    }
    model {
      person this ""
    }`
  test('disallow element with name "this" via =').invalid`
    specification {
      element person
    }
    model {
      this = person ""
    }`

  test('disallow element with name "it"').invalid`
    specification {
      element person
    }
    model {
      person it ""
    }`

  test('disallow element with name "it" via =').invalid`
    specification {
      element person
    }
    model {
      it = person ""
    }`

  test('allow element with kind "solid" (reserved for line style)').valid`
    specification {
      element solid
    }
    model {
      solid el1
      el2 = solid
    }`

  test('element with title').valid`
    specification {
      element person
    }
    model {
      person user1 'Person1'
      user2 = person 'Person2'
      user3 = person // unnamed
    }`

  test('element with unicode and emoji in title').valid`
    specification {
      element person
    }
    model {
      person user1 'Пользователь 1'
      user2 = person 'Person 👨‍💻'
      user3 = person // unnamed
    }`

  test('element with style').valid`
    specification {
      element person
    }
    model {
      user1 = person {
        style {
          shape person
          color secondary
          border none
          opacity 10%
        }
      }
      user2 = person
    }`

  test('element with tags').valid`
    specification {
      element person
      tag one
      tag two
      tag three
    }
    model {
      user1 = person {
        #one
      }
      user2 = person {
        #one #two
      }
      user3 = person {
        #one, #two
        title 'Person3'
      }
      user4 = person {
        #one, #two
        #three
        title 'Person4'
      }
      user5 = person {
        #one #two, #three;
        title 'Person4'
      }
    }`

  test('fail if name is string').invalid`
    specification {
      element person
    }
    model {
      person 'Person2'
    }
    `

  test('fail if name starts with number').invalid`
    specification {
      element person
    }
    model {
      person 1person
    }
    `

  // TODO: previously this was invalid, but now it's valid
  test('not fail if tag has a space after dash').valid`
    specification {
      element person
      tag one
    }
    model {
      user1 = person {
        # one
      }
    }`

  test('should not fail if comma left after tag').valid`
    specification {
      element person
      tag one
    }
    model {
      user1 = person {
        #one,
      }
    }`

  test('element with nested elements').valid`
    specification {
      element person
      element system
      element component
    }
    model {
      person user1
      user2 = person {
      }
      user3 = person 'Person3'
      component system {
        subsystem = component
        backend = component {
          api = component 'API'
        }
      }
    }`

  test('fail if nested element name is string').invalid`
    specification {
      element person
      element component
    }
    model {
      person user1
      component system {
        component 'Subsystem'
        component backend
      }
    }
    `

  test('element with properties').valid`
    specification {
      element component
      tag one
    }
    model {
      component system {
        #one

        component subsystem {
          title: 'SubSystem';
          description 'Handles subsystem logic';
        }

        component storage {
          title 'Storage'
          style {
            shape: storage
          }
        }
      }
    }`

  test('element with icon').valid`
    specification {
      element component
    }
    model {
      component system1 {
        icon https://icons.terrastruct.com/dev%2Ftypescript.svg
      }
      component system2 {
        style {
          icon: https://icons.terrastruct.com/dev%2Ftypescript.svg
        }
      }
    }`

  test('element with libicon').valid`
    specification {
      element component
    }
    model {
      component system1 {
        icon tech:react
      }
      component system2 {
        style {
          icon aws:rds
        }
      }
    }`
  test('element with icon none').valid`
    specification {
      element component
    }
    model {
      component system1 {
        icon none
      }
      component system2 {
        style {
          icon none
        }
      }
    }`

  test('element with metada').valid`
    specification {
      element component
    }
    model {
      component system1 {
        metadata {
          arch 'x64'
          platform 'winodws'
        }
      }
      component system2 {
        metadata {
          arch 'x64'
          platform 'linux'
        }
      }
    }`
})
