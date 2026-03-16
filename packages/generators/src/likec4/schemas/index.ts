import type z from 'zod/v4'
import * as common from './common'
import * as deployment from './deployment'
import * as expr from './expression'
import { likec4data } from './likec4data'
import * as model from './model'
import * as specification from './specification'
import * as views from './views'

export const schemas = {
  common,
  expr,
  specification,
  model,
  deployment,
  views,
  likec4data,
}

export namespace schemas {
  export namespace common {
  }

  export namespace expr {
    export type Input = z.input<typeof schemas.expr.expression>
    export type Data = z.output<typeof schemas.expr.expression>
  }

  export namespace specification {
    export type Input = z.input<typeof schemas.specification.schema>
  }

  export namespace model {
    export type Input = z.input<typeof schemas.model.schema>

    export namespace element {
      export type Input = z.input<typeof schemas.model.element>
      export type Data = z.output<typeof schemas.model.element>
    }

    export namespace relationship {
      export type Input = z.input<typeof schemas.model.relationship>
      export type Data = z.output<typeof schemas.model.relationship>
    }
  }

  export namespace deployment {
    export type Input = z.input<typeof schemas.deployment.schema>
    export type Data = z.output<typeof schemas.deployment.schema>

    export namespace node {
      export type Input = z.input<typeof schemas.deployment.node>
      export type Data = z.output<typeof schemas.deployment.node>
    }

    export namespace instance {
      export type Input = z.input<typeof schemas.deployment.instance>
      export type Data = z.output<typeof schemas.deployment.instance>
    }

    export namespace element {
      export type Input = z.input<typeof schemas.deployment.element>
      export type Data = z.output<typeof schemas.deployment.element>
    }

    export namespace relationship {
      export type Input = z.input<typeof schemas.deployment.relationship>
      export type Data = z.output<typeof schemas.deployment.relationship>
    }
  }

  export namespace views {
    export namespace elementView {
      export type Input = z.input<typeof schemas.views.elementView>
      export type Data = z.output<typeof schemas.views.elementView>
    }
  }

  export namespace likec4data {
    export type Input = z.input<typeof schemas.likec4data>
    export type Data = z.output<typeof schemas.likec4data>
  }
}
