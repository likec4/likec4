# Model diffs

A `diff` is a named, planned change of the model (for example, an RFC).
It does not change the model.

```likec4
diff rfc1 'RFC-1: Payments service' {
  description 'Replace the SOAP gateway with a Payments service'

  remove {
    shop.legacyPayments                      // element, its descendants and their relationships
    shop.orders -> bank 'checks fraud score' // relationship: source, target, kind, title and direction must match
  }

  add {
    extend shop {
      payments = container 'Payments Service'
    }
    shop.orders -> shop.payments 'requests payments'
    extend shop.orders {
      #next // tags, links and metadata for an existing element
    }
  }
}
```

## Rules

- `remove` lists elements and relationships that exist in the model. Use full FQNs.
- `add` has the syntax of a `model` block: elements, relationships, `extend` of elements.
- A diff cannot extend relationships, cannot remove elements added by a diff, and cannot add an element that exists.
- Diffs with the same name in several files are merged.
- Views can reference elements added by a diff: the model "as is" ignores these references.
