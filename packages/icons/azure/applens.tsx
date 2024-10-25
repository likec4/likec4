// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgApplens = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x2={18} y1={9} y2={9} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={3.092} x2={14.9} y1={8.98} y2={8.98} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={3.154} x2={10.922} y1={6.215} y2={6.215} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={0.432} stopColor="#3890e4" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M9.276 0a8.96 8.96 0 0 0-5.308 1.54.6.6 0 0 0-.138.873l.788.993a7.1 7.1 0 1 1-2.534 3.953.6.6 0 0 0-.412-.707l-.657-.2a.6.6 0 0 0-.763.434A9 9 0 1 0 9.276 0"
    />
    <circle cx={13.69} cy={7.663} r={1.437} fill="#f78d1e" />
    <circle cx={7.896} cy={13.799} r={1.437} fill="#f78d1e" />
    <path
      fill={`url(#b-${suffix})`}
      d="M6.125 6.191 4.993 4.659a5.9 5.9 0 0 1 8.859.983c-.054 0-.106-.016-.162-.016a2.03 2.03 0 0 0-1.617.812 3.984 3.984 0 0 0-5.948-.247M5.859 13.8a2.03 2.03 0 0 1 .761-1.575A4 4 0 0 1 5.022 9.6a4 4 0 0 1 .024-1.338.6.6 0 0 0-.409-.689l-.66-.205a.6.6 0 0 0-.766.448A5.88 5.88 0 0 0 5.879 14c-.006-.07-.02-.134-.02-.2m7.831-4.1a2 2 0 0 1-.721-.138 4.02 4.02 0 0 1-3.233 3.376 1.99 1.99 0 0 1-.114 1.93A5.9 5.9 0 0 0 14.9 9.293a2.03 2.03 0 0 1-1.21.407"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="M9.253 7.094a1.9 1.9 0 0 0-.834.074L3.973 1.507l-.59.463a.6.6 0 0 0-.1.843L7.359 8A1.9 1.9 0 0 0 7.1 9.26a1.923 1.923 0 1 0 2.153-2.166"
    />
  </svg>
)}
export default SvgApplens
