---
'@likec4/language-server': patch
'@likec4/generators': patch
'@likec4/core': patch
---

Allow referencing global predicate groups inside view groups, so a reusable set of predicates can be scoped into a named group:

```likec4
views {
  view of newServices {
    include cloud.new.*

    group 'Microservices' {
      global predicate microservices
    }
  }
}
```
