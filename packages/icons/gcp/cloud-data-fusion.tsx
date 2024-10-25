// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCloudDataFusion = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:#aecbfa}.cls-3{fill:#669df6}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path d="M6 8h4V4H3a1 1 0 0 0-1 1v16a1 1 0 0 0 .28.68L6 18Z" className="cls-1" />
      <path d="m16 18 3.72 3.72A1 1 0 0 0 20 21v-7h-4Z" fill="#4285f4" />
      <path d="M21.71 2.28 18 6v4h4V3a1 1 0 0 0-.29-.72" className="cls-3" />
      <path d="m18 6 3.72-3.72A1 1 0 0 0 21 2h-7v4Z" className="cls-1" />
      <path d="m2 22 4-4h10l4 4z" className="cls-3" />
    </g>
  </svg>
)}
export default SvgCloudDataFusion
