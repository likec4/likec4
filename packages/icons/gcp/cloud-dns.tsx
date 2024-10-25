// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCloudDns = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-2{fill:#669df6}.cls-3{fill:#aecbfa}.cls-4{fill:#fff}'}</style>
    </defs>
    <g data-name="Product Icons">
      <g data-name="colored-32/dns">
        <path id={`Fill-1-${suffix}`} d="M13 18h-2V8h2z" fill="#4285f4" />
        <path id={`Fill-2-${suffix}`} d="M2 21h20v-2H2z" className="cls-2" />
        <path id={`Fill-3-${suffix}`} d="M10 22h4v-4h-4z" className="cls-3" />
      </g>
      <path d="M2 2h20v6H2z" className="cls-3" />
      <path d="M12 2h10v6H12z" className="cls-2" />
      <path d="M4 4h2v2H4z" className="cls-4" />
      <path d="M2 10h20v6H2z" className="cls-3" />
      <path d="M12 10h10v6H12z" className="cls-2" />
      <path d="M4 12h2v2H4z" className="cls-4" />
    </g>
  </svg>
)}
export default SvgCloudDns
