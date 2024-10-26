// @ts-nocheck

import type { SVGProps } from 'react'
const SvgGear = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id="Gear_svg__a"
        x1={9}
        x2={9}
        y1={297.5}
        y2={280.5}
        gradientTransform="translate(0 -280)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={1} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <path
      fill="url(#Gear_svg__a)"
      d="M17.5 9.9V8l-.3-.1-2.1-.7-.5-1.3 1.1-2.2-1.4-1.4-.3.1-1.9 1-1.3-.5L9.9.5H8l-.1.3-.7 2-1.3.6-2.2-1.1-1.4 1.4.1.3 1 1.9-.5 1.3-2.4.9V10l.3.1 2.1.7.5 1.3-1.1 2.2 1.4 1.4.3-.1 1.9-1 1.3.5.9 2.3H10l.1-.3.7-2.1 1.3-.5 2.2 1.1 1.4-1.4-.1-.2-1-1.9.5-1.3Z"
    />
    <path
      fill="#fff"
      d="m12.3 6.5-.8.7a2.91 2.91 0 0 1-.3 4.2 2.906 2.906 0 0 1-4.2-.3 2.91 2.91 0 0 1 0-3.9h.1l.6.5h.1v-.1l-.2-2c0-.1-.1-.1-.2-.1l-1.9.3a.1.1 0 0 0-.1.1l.6.5v.1a3.976 3.976 0 1 0 6.1 5.1 3.63 3.63 0 0 0 .2-5.1"
    />
  </svg>
)
export default SvgGear
