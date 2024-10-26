// @ts-nocheck

import type { SVGProps } from 'react'
const SvgGuide = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <radialGradient id="Guide_svg__a" cx={9} cy={9} r={8.5} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={0.333} stopColor="#49ddf7" />
        <stop offset={0.876} stopColor="#37c5e3" />
        <stop offset={1} stopColor="#32bedd" />
      </radialGradient>
    </defs>
    <circle cx={9} cy={9} r={8.5} fill="url(#Guide_svg__a)" />
    <circle cx={9} cy={9} r={6.761} fill="#198ab3" />
    <path fill="#fff" d="m6.916 8.637 4.022 1.174-.514-5.122a.179.179 0 0 0-.318-.093Z" />
    <path fill="#50e6ff" d="M10.96 9.735 6.938 8.56l.514 5.123a.179.179 0 0 0 .318.093Z" />
  </svg>
)
export default SvgGuide
