import type { HexColor } from "../../types";

export const lightValue = {
      elements: {
        fill: "#caf2ff" as HexColor,
        stroke: "#a2c9d6" as HexColor,
        hiContrast: "#2a505b" as HexColor,
        loContrast: "#3c626d" as HexColor,
        light: "#caf2ff" as HexColor,
        dark: "#98bfcc" as HexColor,
      },
      relationships: {
        lineColorLight: "#caf2ff" as HexColor,
        lineColorDark: "#98bfcc" as HexColor,
        labelColor: "#2a505b" as HexColor,
        labelBgColor: "#caf2ff" as HexColor,
      },
    }

export const darkValue = {
      elements: {
        fill: "#1F32C4" as HexColor,
        stroke: "#00129c" as HexColor,
        hiContrast: "#ffffff" as HexColor,
        loContrast: "#ffedff" as HexColor,
        light: "#665df8" as HexColor,
        dark: "#1F32C4" as HexColor,
      },
      relationships: {
        lineColorLight: "#665df8" as HexColor,
        lineColorDark: "#1F32C4" as HexColor,
        labelColor: "#ffffff" as HexColor,
        labelBgColor: "#1F32C4" as HexColor,
      },
    }