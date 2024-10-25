// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgMobileEngagement = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={22.81} y2={-2.491} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.165} stopColor="#1c84dc" />
        <stop offset={0.378} stopColor="#3990e4" />
        <stop offset={0.59} stopColor="#4d99ea" />
        <stop offset={0.799} stopColor="#5a9eee" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={9} x2={9} y1={15.982} y2={1.522} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#d2ebff" />
        <stop offset={0.997} stopColor="#f0fffd" />
      </linearGradient>
    </defs>
    <rect width={10.777} height={18} x={3.612} fill={`url(#a-${suffix})`} rx={0.419} />
    <rect width={2.483} height={0.333} x={7.758} y={0.604} fill="#f2f2f2" rx={0.154} />
    <rect width={8.754} height={14.461} x={4.623} y={1.522} fill={`url(#b-${suffix})`} opacity={0.9} rx={0.201} />
    <rect width={1.204} height={1.028} x={8.398} y={16.58} fill="#f2f2f2" rx={0.286} />
    <path
      fill="#5ea0ef"
      d="M11.4 2.892v3.584a.19.19 0 0 1-.193.192h-1.5a.047.047 0 0 0-.047.047v.578a.094.094 0 0 1-.151.074l-.9-.689a.05.05 0 0 0-.029-.01H5.974a.19.19 0 0 1-.193-.192V2.892a.19.19 0 0 1 .193-.192h5.236a.19.19 0 0 1 .19.192"
    />
    <rect width={1.683} height={4.782} x={5.768} y={9.88} fill="#5ea0ef" rx={0.293} />
    <rect width={1.683} height={5.855} x={8.265} y={8.806} fill="#0078d4" rx={0.293} />
    <rect width={1.683} height={6.734} x={10.761} y={7.927} fill="#005ba1" rx={0.293} />
  </svg>
)}
export default SvgMobileEngagement
