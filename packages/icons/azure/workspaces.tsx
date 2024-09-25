// @ts-nocheck

import type { SVGProps } from 'react'
const SvgWorkspaces = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={9} x2={9} y1={17.5} y2={0.5} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#005ba1" />
        <stop offset={0.168} stopColor="#0063ae" />
        <stop offset={0.577} stopColor="#0072ca" />
        <stop offset={0.815} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <circle cx={9} cy={9} r={8.5} fill="url(#a)" />
    <path
      fill="#7de2fb"
      fillRule="evenodd"
      d="M8.88 4.69a.753.753 0 0 0-.753.752v3.694a.753.753 0 0 0 .753.752h3.693a.75.75 0 0 0 .752-.752V5.442a.75.75 0 0 0-.752-.752Zm.677.978a.45.45 0 0 0-.452.451v2.339a.45.45 0 0 0 .452.452H11.9a.45.45 0 0 0 .451-.452V6.119a.45.45 0 0 0-.451-.451Z"
    />
    <g fill="#fff">
      <path d="M4.675 7.5a.45.45 0 0 1 .451-.451h1.851a.45.45 0 0 1 .451.451v1.861a.45.45 0 0 1-.451.451H5.126a.45.45 0 0 1-.451-.451ZM4.675 11.008a.45.45 0 0 1 .451-.451h1.851a.45.45 0 0 1 .451.451v1.851a.45.45 0 0 1-.451.451H5.126a.45.45 0 0 1-.451-.451ZM8.127 10.963a.45.45 0 0 1 .452-.451h1.85a.45.45 0 0 1 .452.451v1.851a.45.45 0 0 1-.452.451h-1.85a.45.45 0 0 1-.452-.451Z" />
    </g>
  </svg>
)
export default SvgWorkspaces
