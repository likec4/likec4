// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVirtualNetworkGateways = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={8.59} x2={9.12} y1={-7.79} y2={20.05} gradientUnits="userSpaceOnUse">
        <stop offset={0.22} stopColor="#32d4f5" />
        <stop offset={0.47} stopColor="#31d1f3" />
        <stop offset={0.63} stopColor="#2ec9eb" />
        <stop offset={0.77} stopColor="#29bade" />
        <stop offset={0.89} stopColor="#22a5cb" />
        <stop offset={1} stopColor="#198ab3" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M15.06 8.67h-1V5.59a5.8 5.8 0 0 0-1.49-3.92A4.79 4.79 0 0 0 8.91 0a4.79 4.79 0 0 0-3.7 1.67 5.73 5.73 0 0 0-1.49 3.92v3.08h-.81a.7.7 0 0 0-.69.69v8a.7.7 0 0 0 .69.69h12.15a.71.71 0 0 0 .7-.69v-8a.71.71 0 0 0-.7-.69m-3.37 0H6.13V5.54A3.18 3.18 0 0 1 7 3.39a2.5 2.5 0 0 1 1.88-.86 2.54 2.54 0 0 1 1.89.86 3 3 0 0 1 .32.43 3 3 0 0 1 .61 1.71Z"
    />
    <path
      fill="#50e6ff"
      d="M15.09 8.67H2.92a.66.66 0 0 0-.44.17l13.05 9a.67.67 0 0 0 .25-.52v-8a.71.71 0 0 0-.69-.65"
    />
    <path
      fill="#fff"
      d="M2.94 8.67H15.1a.7.7 0 0 1 .45.17l-13.06 9a.7.7 0 0 1-.25-.52v-8a.72.72 0 0 1 .7-.65"
      opacity={0.2}
    />
    <path
      fill="#fff"
      d="M7.8 10.6 9 9.4a.07.07 0 0 1 .09 0l1.19 1.2a.06.06 0 0 1 0 .1h-.7a.06.06 0 0 0-.06.06v1.54a.06.06 0 0 1-.06.06h-.79a.05.05 0 0 1-.06-.06v-1.54a.07.07 0 0 0-.07-.06h-.7a.06.06 0 0 1-.04-.1m2.47 5.48-1.19 1.19a.06.06 0 0 1-.09 0L7.8 16.08a.06.06 0 0 1 0-.1h.7a.07.07 0 0 0 .07-.06v-1.55a.06.06 0 0 1 .06-.06h.74a.06.06 0 0 1 .06.06v1.55a.06.06 0 0 0 .06.06h.7a.06.06 0 0 1 .08.1m-4.7-1.55v-.7a.06.06 0 0 0-.06-.06H4a.06.06 0 0 1-.06-.06V13a.06.06 0 0 1 .06-.09h1.51a.06.06 0 0 0 .06-.06v-.7a.07.07 0 0 1 .11-.05l1.19 1.2a.06.06 0 0 1 0 .08l-1.19 1.2a.07.07 0 0 1-.11-.05m6.93-2.38v.7a.06.06 0 0 0 .06.06h1.54s.07 0 .07.06v.74a.07.07 0 0 1-.07.06h-1.54a.06.06 0 0 0-.06.06v.7a.06.06 0 0 1-.1.05l-1.19-1.2v-.08l1.19-1.2s.1-.01.1.05"
    />
  </svg>
)}
export default SvgVirtualNetworkGateways
