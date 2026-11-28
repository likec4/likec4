---
'@likec4/diagram': patch
'@likec4/vite-plugin': patch
'likec4': patch
---

UI customization (experimental) has a new API: the customization file default-exports `createCustomization({ components })`, and the overrides are defined with `customizeComponents`, which takes the same object or the `wrap` function as before. In your own React app, render the provider returned by `createCustomization` above the diagrams.

`defineCustomComponents` and `CustomizationProvider` are removed. The logo slots are renamed: `LogoSvg` to `Logo`, and `LogoIconSvg` to `LogoIcon`.

Migration of a customization file:

```tsx
// before
export default defineCustomComponents(({ wrap }) => ({ ... }))
// after
export default createCustomization({
  components: customizeComponents(({ wrap }) => ({ ... })),
})
```

The edge primitives (`EdgeContainer`, `EdgePath`, `EdgeLabel`, `EdgeLabelContainer`, `EdgeMarkers`, `EdgeActionButton`) are exported from `@likec4/diagram/custom` and `likec4/react`.
