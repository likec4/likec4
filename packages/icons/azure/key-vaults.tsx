// @ts-nocheck

import type { SVGProps } from 'react'
const SvgKeyVaults = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <radialGradient id="a" cx={9} cy={9} r={8.5} gradientUnits="userSpaceOnUse">
        <stop offset={0.18} stopColor="#5ea0ef" />
        <stop offset={0.56} stopColor="#5c9fee" />
        <stop offset={0.69} stopColor="#559ced" />
        <stop offset={0.78} stopColor="#4a97e9" />
        <stop offset={0.86} stopColor="#3990e4" />
        <stop offset={0.93} stopColor="#2387de" />
        <stop offset={0.99} stopColor="#087bd6" />
        <stop offset={1} stopColor="#0078d4" />
      </radialGradient>
      <radialGradient
        id="b"
        cx={38.95}
        cy={182.07}
        r={9.88}
        gradientTransform="matrix(.94 0 0 .94 -28.71 -163.24)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.27} stopColor="#ffd70f" />
        <stop offset={0.49} stopColor="#ffcb12" />
        <stop offset={0.88} stopColor="#feac19" />
        <stop offset={1} stopColor="#fea11b" />
      </radialGradient>
    </defs>
    <path
      fill="url(#a)"
      d="M9 .5A8.5 8.5 0 1 0 17.5 9 8.51 8.51 0 0 0 9 .5m0 15.84A7.34 7.34 0 1 1 16.34 9 7.34 7.34 0 0 1 9 16.34"
    />
    <circle cx={9} cy={9} r={7.34} fill="#fff" />
    <path
      fill="url(#b)"
      d="M13.44 7.33a1.84 1.84 0 0 0 0-2.59l-3.15-3.16a1.83 1.83 0 0 0-2.58 0L4.56 4.74a1.84 1.84 0 0 0 0 2.59L7.18 10a.5.5 0 0 1 .15.36v4.88a.63.63 0 0 0 .18.44l1.2 1.2a.41.41 0 0 0 .58 0l1.16-1.16.68-.68a.25.25 0 0 0 0-.34l-.49-.49a.27.27 0 0 1 0-.37l.49-.49a.25.25 0 0 0 0-.34l-.49-.49a.27.27 0 0 1 0-.37l.49-.49a.25.25 0 0 0 0-.34l-.68-.69v-.25ZM9 2.35a1 1 0 0 1 0 2.07 1 1 0 1 1 0-2.07"
    />
    <path
      fill="#ff9300"
      d="M8.18 15.3a.23.23 0 0 0 .38-.17v-4a.24.24 0 0 0-.11-.2.22.22 0 0 0-.34.2v4a.28.28 0 0 0 .07.17"
      opacity={0.75}
    />
    <rect width={5.17} height={0.61} x={6.48} y={5.79} fill="#ff9300" opacity={0.75} rx={0.28} />
    <rect width={5.17} height={0.61} x={6.48} y={6.78} fill="#ff9300" opacity={0.75} rx={0.28} />
  </svg>
)
export default SvgKeyVaults
