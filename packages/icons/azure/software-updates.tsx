// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgSoftwareUpdates = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={15.84} y2={0.52} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#d2ebff" />
        <stop offset={1} stopColor="#f0fffd" />
      </linearGradient>
    </defs>
    <rect width={18} height={12.81} y={1.13} fill="#0078d4" rx={0.6} />
    <rect width={15.91} height={10.9} x={1.05} y={2.03} fill={`url(#a-${suffix})`} opacity={0.9} rx={0.33} />
    <rect width={1.91} height={0.26} x={8.07} y={1.53} fill="#f2f2f2" rx={0.12} />
    <circle cx={12.87} cy={12.65} r={4.22} fill="#76bc2d" />
    <path
      fill="#fff"
      d="M10.35 12a2.8 2.8 0 0 0-.08 1 2.65 2.65 0 0 0 .36 1 2.5 2.5 0 0 0 .48.6 3 3 0 0 0 .61.43 3.6 3.6 0 0 0 .72.25 2.8 2.8 0 0 0 .76 0l-.07-.73a.14.14 0 0 0-.14-.14h-.39a2 2 0 0 1-.48-.17 2.4 2.4 0 0 1-.42-.24 1.5 1.5 0 0 1-.32-.4 1.7 1.7 0 0 1-.24-.67 1.9 1.9 0 0 1 0-.71l.25.42a.15.15 0 0 0 .2.05l.31-.18a.15.15 0 0 0 .05-.2l-.84-1.42a.16.16 0 0 0-.21-.05l-1.41.84a.14.14 0 0 0 0 .2l.17.3a.15.15 0 0 0 .21.06ZM13.3 10.88a2.5 2.5 0 0 1 .48.17 2 2 0 0 1 .42.3 1.6 1.6 0 0 1 .33.4 1.8 1.8 0 0 1 .23.67 1.9 1.9 0 0 1 0 .71l-.25-.42a.15.15 0 0 0-.2-.06l-.3.18a.15.15 0 0 0-.05.21l.83 1.41a.16.16 0 0 0 .21.06l1.41-.84a.15.15 0 0 0 .06-.21l-.18-.3a.16.16 0 0 0-.21-.05l-.49.29a2.6 2.6 0 0 0 .08-1.08 2.9 2.9 0 0 0-.35-1 3 3 0 0 0-.48-.59 2.8 2.8 0 0 0-1.38-.73 2.5 2.5 0 0 0-.61 0 .14.14 0 0 0-.13.16v.58a.15.15 0 0 0 .14.13 2.6 2.6 0 0 1 .44.01"
    />
  </svg>
)}
export default SvgSoftwareUpdates
