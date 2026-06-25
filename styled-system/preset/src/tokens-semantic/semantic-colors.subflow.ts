import { defineSemanticTokens } from '@pandacss/dev'
import { mantine } from '../generated.ts'
import { alpha } from '../helpers.ts'

export const { subflow } = defineSemanticTokens.colors({
  subflow: {
    /**
     * -----------------
     * OPT
     */
    opt: {
      DEFAULT: {
        value: alpha(mantine.colors.indigo[8], 8),
      },
      text: {
        value: {
          base: alpha(mantine.colors.indigo[9], 75),
          _dark: alpha(mantine.colors.indigo[2], 90),
        },
      },
      border: {
        value: {
          base: alpha(mantine.colors.indigo[7], 65),
          _dark: alpha(mantine.colors.indigo[7], 65),
        },
      },
      label: {
        value: alpha(mantine.colors.indigo[7], 20),
      },
    },
    /**
     * -----------------
     * LOOP
     */
    loop: {
      DEFAULT: {
        value: {
          base: alpha(mantine.colors.teal[9], 8),
          _dark: alpha(mantine.colors.teal[8], 9),
        },
      },
      text: {
        value: {
          base: mantine.colors.dark[9],
          _dark: alpha(mantine.colors.teal[2], 95),
        },
      },
      border: {
        value: {
          base: alpha(mantine.colors.teal[9], 60),
          _dark: alpha(mantine.colors.teal[8], 60),
        },
      },
      header: {
        value: alpha(mantine.colors.teal[8], 40),
      },
      label: {
        value: alpha(mantine.colors.teal[8], 20),
      },
    },
    /**
     * -----------------
     * TRY
     */
    try: {
      block: {
        DEFAULT: {
          value: {
            base: alpha(mantine.colors.yellow[9], 8),
            _dark: alpha(mantine.colors.yellow[8], 8),
          },
        },
        text: {
          value: {
            base: mantine.colors.orange[9],
            _dark: alpha(mantine.colors.orange[1], 80),
          },
        },
        border: {
          value: {
            base: alpha(mantine.colors.yellow[9], 80),
            _dark: alpha(mantine.colors.yellow[7], 40),
          },
        },
        header: {
          value: {
            base: alpha(mantine.colors.yellow[9], 60),
            _dark: alpha(mantine.colors.orange[8], 40),
          },
        },
        label: {
          value: alpha(mantine.colors.yellow[8], 20),
        },
      },
      // try catch
      catch: {
        DEFAULT: {
          value: {
            base: alpha(mantine.colors.red[9], 8),
            _dark: alpha(mantine.colors.red[8], 8),
          },
        },
        text: {
          value: {
            base: alpha(mantine.colors.red[9], 90),
            _dark: alpha(mantine.colors.red[3], 90),
          },
        },
        border: {
          value: alpha(mantine.colors.red[7], 65),
        },
        label: {
          value: alpha(mantine.colors.red[8], 25),
        },
      },
    },
    /**
     * -----------------
     * PAR
     */
    par: {
      DEFAULT: {
        value: alpha(mantine.colors.grape[8], 8),
      },
      text: {
        value: {
          base: alpha(mantine.colors.grape[9], 75),
          _dark: alpha(mantine.colors.grape[2], 90),
        },
      },
      border: {
        value: alpha(mantine.colors.grape[7], 65),
      },
      header: {
        value: alpha(mantine.colors.grape[8], 40),
      },
      label: {
        value: alpha(mantine.colors.grape[7], 20),
      },
    },
    /**
     * -----------------
     * ALT
     */
    alt: {
      DEFAULT: {
        value: {
          base: alpha(mantine.colors.violet[9], 5),
          _dark: alpha(mantine.colors.violet[8], 10),
        },
      },
      header: {
        value: {
          base: alpha(mantine.colors.violet[8], 50),
          _dark: alpha(mantine.colors.violet[8], 40),
        },
      },
      text: {
        value: {
          base: alpha(mantine.colors.violet[9], 90),
          _dark: alpha(mantine.colors.violet[2], 90),
        },
      },
      border: {
        value: alpha(mantine.colors.violet[7], 65),
      },
      label: {
        value: alpha(mantine.colors.violet[7], 30),
      },
    },
  },
})
