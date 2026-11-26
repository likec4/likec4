---
'likec4': patch
---

Editing `.c4` files with the Vite plugin now updates server-rendered pages too. The plugin only reloaded the model for the browser, so a page that reads the model on the server, such as an Astro or Starlight page, kept showing the old model until the dev server was restarted.
