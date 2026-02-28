---
'likec4': minor
---

Use MantineProvider's `forceColorScheme` for the `?theme=` URL parameter instead of `setColorScheme`.

Theme preferences specified via the URL are no longer persisted to localStorage — the forced
color scheme applies only while the `?theme=` parameter is present in the URL.

The `theme` search param default changed from `'auto'` to `undefined`; the parameter is now
optional and omitted from URLs when not explicitly set.
