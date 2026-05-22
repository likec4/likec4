---
'@likec4/react': patch
'likec4': patch
---

Drop the `react-shadow` dependency and inline shadow-root rendering directly. Mark `use-sync-external-store` as external to avoid duplicate React internals.
