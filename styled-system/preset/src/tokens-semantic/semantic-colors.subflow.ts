import { defineSemanticTokens } from '@pandacss/dev'
import { defaultMantineColors as colors } from '../generated.ts'
import { alpha } from '../helpers.ts'

export const { subflow } = defineSemanticTokens.colors({
  subflow: {
    /**
     * -----------------
     * OPT
     */
    opt: {
      DEFAULT: {
        value: alpha(colors.indigo[8], 8),
      },
      hovered: {
        description: 'Background color when hovered',
        value: alpha(colors.indigo[8], 13),
      },
      text: {
        value: {
          base: alpha(colors.indigo[9], 75),
          _dark: alpha(colors.indigo[2], 90),
        },
      },
      border: {
        value: alpha(colors.indigo[7], 65),
      },
      label: {
        value: alpha(colors.indigo[7], 20),
      },
    },
    /**
     * -----------------
     * LOOP
     */
    loop: {
      DEFAULT: {
        value: {
          base: alpha(colors.teal[9], 8),
          _dark: alpha(colors.teal[8], 9),
        },
      },
      hovered: {
        description: 'Background color when hovered',
        value: {
          base: alpha(colors.teal[9], 13),
          _dark: alpha(colors.teal[8], 14),
        },
      },
      text: {
        value: {
          base: colors.teal[9],
          _dark: alpha(colors.teal[2], 95),
        },
      },
      border: {
        value: {
          base: alpha(colors.teal[9], 60),
          _dark: alpha(colors.teal[8], 60),
        },
      },
      header: {
        value: alpha(colors.teal[8], 40),
      },
      label: {
        value: alpha(colors.teal[8], 20),
      },
    },
    /**
     * -----------------
     * TRY
     */
    try: {
      DEFAULT: {
        value: {
          base: alpha(colors.yellow[9], 8),
          _dark: alpha(colors.yellow[8], 8),
        },
      },
      hovered: {
        description: 'Background color when hovered',
        value: {
          base: alpha(colors.yellow[9], 13),
          _dark: alpha(colors.yellow[8], 13),
        },
      },
      text: {
        value: {
          base: colors.orange[9],
          _dark: alpha(colors.orange[1], 80),
        },
      },
      border: {
        value: {
          base: alpha(colors.yellow[9], 80),
          _dark: alpha(colors.yellow[7], 40),
        },
      },
      header: {
        value: {
          base: alpha(colors.yellow[9], 60),
          _dark: alpha(colors.orange[8], 40),
        },
      },
      label: {
        value: alpha(colors.yellow[8], 20),
      },
    },
    /**
     * -----------------
     * Break
     */
    break: {
      DEFAULT: {
        value: {
          base: alpha(colors.red[9], 8),
          _dark: alpha(colors.red[8], 8),
        },
      },
      hovered: {
        description: 'Background color when hovered',
        value: {
          base: alpha(colors.red[9], 13),
          _dark: alpha(colors.red[8], 13),
        },
      },
      text: {
        value: {
          base: alpha(colors.red[9], 90),
          _dark: alpha(colors.red[3], 90),
        },
      },
      border: {
        value: alpha(colors.red[7], 65),
      },
      header: {
        value: {
          base: alpha(colors.red[9], 40),
          _dark: alpha(colors.red[8], 40),
        },
      },
      label: {
        value: alpha(colors.red[8], 25),
      },
    },
    /**
     * -----------------
     * PAR
     */
    par: {
      DEFAULT: {
        value: alpha(colors.grape[8], 8),
      },
      hovered: {
        description: 'Background color when hovered',
        value: alpha(colors.grape[8], 13),
      },
      text: {
        value: {
          base: alpha(colors.grape[9], 75),
          _dark: alpha(colors.grape[2], 90),
        },
      },
      border: {
        value: alpha(colors.grape[7], 65),
      },
      header: {
        value: alpha(colors.grape[8], 40),
      },
      label: {
        value: alpha(colors.grape[7], 20),
      },
    },
    /**
     * -----------------
     * ALT
     */
    alt: {
      DEFAULT: {
        value: {
          base: alpha(colors.violet[9], 5),
          _dark: alpha(colors.violet[8], 10),
        },
      },
      hovered: {
        description: 'Background color when alt is hovered',
        value: {
          base: alpha(colors.violet[9], 10),
          _dark: alpha(colors.violet[8], 15),
        },
      },
      header: {
        value: alpha(colors.violet[8], 50),
      },
      text: {
        value: {
          base: alpha(colors.violet[9], 90),
          _dark: alpha(colors.violet[2], 90),
        },
      },
      border: {
        value: alpha(colors.violet[7], 65),
      },
      label: {
        value: alpha(colors.violet[7], 30),
      },
    },
  },
})
