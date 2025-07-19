import type { HexColor } from "../../types";

export const lightValue = {
      elements: {
        fill: "#2ec2fb" as HexColor,
        stroke: "#1fabe1" as HexColor,
        hiContrast: "#0084b2" as HexColor,
        loContrast: "#0098c9" as HexColor,
      },
      relationships: {
        lineColor: "#4ccdfb" as HexColor,
        labelColor: "#6fd8fc" as HexColor,
        labelBgColor: "#0084b2" as HexColor,
      },
    }

export const darkValue = {
      elements: {
        fill: "#2c40dc" as HexColor,
        stroke: "#1f32c4" as HexColor,
        hiContrast: "#ecefff" as HexColor,
        loContrast: "#d5dafb" as HexColor,
      },
      relationships: {
        lineColor: "#5362e1" as HexColor,
        labelColor: "#7a87e9" as HexColor,
        labelBgColor: "#0a259c" as HexColor,
      },
    }