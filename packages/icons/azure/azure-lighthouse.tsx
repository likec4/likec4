// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureLighthouse = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={17.86} y2={4.06} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.16} stopColor="#1380da" />
        <stop offset={0.53} stopColor="#3c91e5" />
        <stop offset={0.82} stopColor="#559cec" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="m16.65 17.08-3.59-9.32a.28.28 0 0 0-.26-.18h-2.56V5.36a1.3 1.3 0 1 0-2.59 0v2.22H5.34a.29.29 0 0 0-.27.18l-3.72 9.32a.55.55 0 0 0 .45.78h14.4a.55.55 0 0 0 .45-.78"
    />
    <path
      fill="#83b9f9"
      d="M3.37 12 12 7.58h.75a.28.28 0 0 1 .27.19l.83 2.15L1.8 16ZM9.54 17.84l6-3.6 1.09 2.84a.56.56 0 0 1-.46.78Z"
    />
    <path
      fill="#0078d4"
      d="M8.87.16 4.75 2.55a.16.16 0 0 0-.08.14v.37a.16.16 0 0 0 .16.16h.62v4.36h.78V3.22h5.44v4.36h.77V3.22h.63a.16.16 0 0 0 .16-.16v-.37a.16.16 0 0 0-.08-.14L9 .16a.22.22 0 0 0-.13 0"
    />
  </svg>
)}
export default SvgAzureLighthouse
