# `@likec4/icons`

React SVG icons from these packs:
- [techicons.dev](https://techicons.dev/) (sourced from [devicons](https://github.com/devicons/devicon))
- [aws-icons.com](https://aws-icons.com/)
- [gcpicons.com](https://gcpicons.com/)
- [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/icons/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [Material Symbols](https://fonts.google.com/icons?icon.set=Material+Symbols), using the outlined style

```ts
import { ArgoCd, Astro } from '@likec4/icons'
// or
import { ArgoCd, Astro } from '@likec4/icons/tech'
// or
import ArgoCd from '@likec4/icons/tech/argo-cd'
import Astro from '@likec4/icons/tech/astro'

// same
import { Lambda } from '@likec4/icons/aws'
import Lambda from '@likec4/icons/aws/lambda'

import { DataStudio } from '@likec4/icons/gcp'
import DataStudio from '@likec4/icons/gcp/data-studio'

import { House, GearFill } from '@likec4/icons/bootstrap'
import House from '@likec4/icons/bootstrap/house'

import Home from '@likec4/icons/md/home'
```

Material Symbols are sourced from [marella/material-symbols](https://github.com/marella/material-symbols)
through the pinned `@material-symbols/svg-400` package. Run `pnpm generate` after checkout to create
the ignored `md/` components. The icons use the outlined style and are provided under the Apache 2.0 license; see
[`MATERIAL-SYMBOLS-LICENSE`](./MATERIAL-SYMBOLS-LICENSE).

MIT License
