// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgApplicationGroup = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={17.5} y2={0.5} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#005ba1" />
        <stop offset={0.168} stopColor="#0063ae" />
        <stop offset={0.577} stopColor="#0072ca" />
        <stop offset={0.815} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <circle cx={9} cy={9} r={8.5} fill={`url(#a-${suffix})`} />
    <path
      fill="#fff"
      d="M7.776 10.632h2.448v2.448H7.776ZM4.92 7.368h2.448V4.92H5.262a.34.34 0 0 0-.342.342Zm.342 5.712h2.106v-2.448H4.92v2.106a.34.34 0 0 0 .342.342m-.342-2.856h2.448V7.776H4.92Zm5.712 2.856h2.106a.34.34 0 0 0 .342-.342v-2.106h-2.448Zm-2.856-2.856h2.448V7.776H7.776Zm2.856 0h2.448V7.776h-2.448Zm0-5.3v2.444h2.448V5.262a.34.34 0 0 0-.342-.342ZM7.776 7.368h2.448V4.92H7.776Z"
    />
  </svg>
)}
export default SvgApplicationGroup
