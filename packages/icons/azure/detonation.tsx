// @ts-nocheck

import type { SVGProps } from 'react'
const SvgDetonation = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id="Detonation_svg__a"
        x1={10.646}
        x2={10.646}
        y1={12.18}
        y2={1.846}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#005ba1" />
        <stop offset={0.192} stopColor="#1e71b5" />
        <stop offset={0.567} stopColor="#5598da" />
        <stop offset={0.848} stopColor="#76b0f0" />
        <stop offset={1} stopColor="#83b9f9" />
      </linearGradient>
    </defs>
    <circle cx={10.646} cy={7.013} r={5.167} fill="#fff" />
    <rect
      width={9.59}
      height={2.184}
      x={-0.293}
      y={12.617}
      fill="#767676"
      rx={1.021}
      transform="rotate(-45 4.501 13.709)"
    />
    <circle cx={10.659} cy={7.13} r={6.579} fill="#a3a3a3" />
    <circle cx={10.646} cy={7.013} r={5.167} fill="url(#Detonation_svg__a)" />
    <path fill="#f2f2f2" d="M14.55 5.973a1.575 1.575 0 1 1-2.952 1.1ZM9.7 7.073a1.575 1.575 0 0 1-2.952-1.1Z" />
  </svg>
)
export default SvgDetonation
