import type { DiagramTheme, ThemeColors } from './types'
import { slate, slateDark, indigo, indigoDark } from '@radix-ui/colors'
//@ts-ignore
import { ColorTranslator as Colors } from 'colortranslator';

const shadow = Colors.toRGB(slateDark.slate2)

// radix-ui / indigo
const primary = {
  // shadow: '#131620', // indigo1
  shadow,
  fill: Colors.toRGB(indigoDark.indigo9),
  stroke: Colors.toRGB(indigoDark.indigo10),
  hiContrast: Colors.toRGB(indigoDark.indigo12),
  loContrast: Colors.toRGB(indigo.indigo7)
} satisfies ThemeColors


export const defaultKonvaTheme = {
  font: 'Helvetica',
  relation: {
    lineColor: Colors.toRGB(slate.slate9),
    labelColor: Colors.toRGB(slate.slate7),
  },
  colors: {
    primary: primary,
    secondary: { // radix-ui / violet
      shadow,
      fill: Colors.toRGB(indigoDark.indigo10),
      stroke:  Colors.toRGB(indigoDark.indigo8),
      hiContrast: Colors.toRGB(indigoDark.indigo12),
      loContrast: Colors.toRGB(indigo.indigo6)
    },
    muted: {
      shadow,
      fill: Colors.toRGB(slateDark.slate10),
      stroke: Colors.toRGB(slateDark.slate9),
      hiContrast: Colors.toRGB(slate.slate2),
      loContrast: Colors.toRGB(slate.slate8)
    }
  }
} satisfies DiagramTheme
