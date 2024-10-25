// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgResourcesProvider = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={0} y2={18} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <path fill="#0078d4" d="M8.881 9.269v2.795l-2.416 1.404v-2.799z" />
    <path fill="#5ea0ef" d="m8.881 9.269-2.416 1.403-2.416-1.404 2.416-1.405z" />
    <path fill="#83b9f9" d="M6.465 10.672v2.796l-2.416-1.404V9.268z" />
    <path fill="#0078d4" d="M11.442 4.836v2.795L9.026 9.035V6.236z" />
    <path fill="#5ea0ef" d="M11.442 4.836 9.026 6.24 6.61 4.835l2.416-1.404z" />
    <path fill="#83b9f9" d="M9.026 6.24v2.795L6.61 7.631V4.835z" />
    <path fill="#32bedd" d="M13.967 9.262v2.795l-2.416 1.404v-2.799z" />
    <path fill="#50e6ff" d="m13.967 9.262-2.416 1.404-2.416-1.405 2.416-1.404z" />
    <path fill="#9cebff" d="M11.551 10.666v2.795l-2.416-1.404V9.261z" />
    <path
      fill={`url(#a-${suffix})`}
      d="M9.004.863c.138 0 .276.036.4.108l6.324 3.685a.79.79 0 0 1 .394.686v7.324c0 .283-.15.544-.395.686l-6.324 3.676a.79.79 0 0 1-.798.001l-6.333-3.677a.79.79 0 0 1-.395-.686V5.334c0-.283.151-.544.395-.686L8.606.971a.8.8 0 0 1 .399-.107m0-.863c-.292 0-.58.077-.832.224L1.84 3.901a1.66 1.66 0 0 0-.825 1.433v7.332c0 .588.316 1.138.825 1.433l6.333 3.677a1.65 1.65 0 0 0 1.665-.001l6.324-3.676c.508-.296.824-.845.824-1.433V5.342c0-.587-.315-1.136-.823-1.432L9.838.225A1.66 1.66 0 0 0 9.004 0Z"
    />
  </svg>
)}
export default SvgResourcesProvider
