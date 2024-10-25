// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgNetworkSecurity = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:none}.cls-2{fill:#669df6}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path
        d="M11.5 13v1.79l-2.64-2.67.05-.12H12v-1H8.91a1.5 1.5 0 1 0-1.41 2 1.46 1.46 0 0 0 .66-.16l2.89 2.91A.94.94 0 0 0 12 17v-4ZM11 7a1 1 0 0 0 .5.85V10h.5V6a1 1 0 0 0-1 1"
        className="cls-1"
      />
      <path
        d="M12 17a.94.94 0 0 1-.95-1.25l-2.89-2.91a1.46 1.46 0 0 1-.66.16 1.5 1.5 0 1 1 1.41-2H12v-1h-.5V7.85A1 1 0 0 1 12 6V2L4 5v6.05c0 5.06 3.41 9.8 8 11Z"
        className="cls-2"
      />
      <path d="m8.86 12.12 2.64 2.67V13h.5v-1H8.91ZM15.15 10.86 12.5 8.21V10H12v1h3.09Z" className="cls-2" />
      <path
        d="M13 7a1 1 0 0 1-.05.24l2.91 2.91a1.5 1.5 0 1 1-.77 1.85H12v1h.5v2.15A1 1 0 0 1 12 17v5c4.59-1.15 8-5.89 8-10.95V5l-8-3v4a1 1 0 0 1 1 1"
        fill="#4285f4"
      />
    </g>
  </svg>
)}
export default SvgNetworkSecurity
