// @ts-nocheck

import type { SVGProps } from 'react'
const SvgBrowser = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="Browser_svg__a" x1={9} x2={9} y1={15.834} y2={5.788} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.175} stopColor="#32caea" />
        <stop offset={0.41} stopColor="#32d2f2" />
        <stop offset={0.775} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <path fill="url(#Browser_svg__a)" d="M.5 5.788h17v9.478a.57.57 0 0 1-.568.568H1.068a.57.57 0 0 1-.568-.568z" />
    <path fill="#0078d4" d="M1.071 2.166h15.858a.57.57 0 0 1 .568.568v3.054H.5V2.734a.57.57 0 0 1 .571-.568" />
    <rect width={12.426} height={1.459} x={2.787} y={3.248} fill="#f2f2f2" rx={0.284} />
  </svg>
)
export default SvgBrowser
