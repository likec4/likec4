import chroma from 'chroma-js';

/**
 * Lighten or darken the rgb color following the factor given as parameter.
 * Factor is a number between -1 and 1. A positive value lighten the color, a negative darken the color.
 * 
 * for exemple :
 * - '-0.1' will darken by 10%
 * - '0.30' will lighten by 30%
 *  
 * @returns the adjusted color as RGB array
 */
export function adjustToneRgb(rgb: [number, number, number], factor: number): [number, number, number] {
    // Clamp factor to range [-1, 1]
    factor = Math.max(-1, Math.min(1, factor));

    return rgb.map(channel => {
        const adjusted = factor > 0
            ? channel + (255 - channel) * factor  // lighten
            : channel * (1 + factor);             // darken
        // return a value between 0 and 255
        return Math.round(Math.max(0, Math.min(255, adjusted)));
    }) as [number, number, number];
}

export function adjustToneHex(hex: string, factor: number): string {
  return chroma(adjustToneRgb(chroma(hex).rgb(), factor)).hex()
}
