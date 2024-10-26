// @ts-nocheck

import type { SVGProps } from 'react'
const SvgMonitor = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <radialGradient
        id="Monitor_svg__a"
        cx={5.72}
        cy={7.45}
        r={8.42}
        gradientTransform="translate(3.23 1.51)scale(1.01)"
        gradientUnits="userSpaceOnUse"
      >
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
        id="Monitor_svg__b"
        cx={28.18}
        cy={202.29}
        r={2.7}
        gradientTransform="matrix(.95 0 0 .95 -17.77 -185.01)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.19} stopColor="#8c8e90" />
        <stop offset={0.35} stopColor="#848688" />
        <stop offset={0.6} stopColor="#6e7071" />
        <stop offset={0.91} stopColor="#4a4b4c" />
        <stop offset={1} stopColor="#3e3f3f" />
      </radialGradient>
    </defs>
    <ellipse cx={9} cy={9} fill="url(#Monitor_svg__a)" rx={8.5} ry={8.47} />
    <ellipse cx={9} cy={9} fill="#fff" rx={7.4} ry={7.37} />
    <path fill="#9cebff" d="M2.72 9.44a6.24 6.24 0 0 0 1.82 4l2-2a3.53 3.53 0 0 1-1-2Z" />
    <path
      fill="#32bedd"
      d="M13.13 4.27a6.25 6.25 0 0 0-3.69-1.53v2.79a3.4 3.4 0 0 1 1.71.7ZM4.87 4.27l2 2a3.4 3.4 0 0 1 1.71-.7V2.74a6.25 6.25 0 0 0-3.71 1.53M11.78 6.85a3.6 3.6 0 0 1 .71 1.71h2.79a6.16 6.16 0 0 0-1.53-3.67Z"
    />
    <path fill="#50e6ff" d="m6.22 6.85-2-2a6.16 6.16 0 0 0-1.5 3.71h2.79a3.6 3.6 0 0 1 .71-1.71" />
    <path fill="#f04049" d="M14.14 7a.45.45 0 0 0-.57-.25L9.45 8.41l.32.81 4.12-1.63a.44.44 0 0 0 .25-.59" />
    <circle cx={9} cy={9} r={1.2} fill="url(#Monitor_svg__b)" />
  </svg>
)
export default SvgMonitor
