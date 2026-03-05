import type z from 'zod/v4'
import * as common from './common'
import * as expr from './expression'
import * as model from './model'
import * as specification from './specification'
import * as views from './views'

export const schemas = {
  common,
  expr,
  specification,
  model,
  views,
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

  export namespace views {
    export namespace elementView {
      export type Input = z.input<typeof schemas.views.elementView>
      export type Data = z.output<typeof schemas.views.elementView>
    }
  }
}
