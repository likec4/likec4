// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCloudInterconnect = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1,.cls-3{fill:#4285f4;fill-rule:evenodd}.cls-3{fill:#669df6}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path id={`Fill-3-${suffix}`} d="M2 13h4v-2H2z" className="cls-1" />
      <path id={`Fill-6-${suffix}`} d="M15 17H5V7h10z" fillRule="evenodd" fill="#aecbfa" />
      <path id={`Fill-1-${suffix}`} d="M17.33 13H22v-2h-4.67z" className="cls-1" />
      <path d="M8 3v2h9v14H8v2h11V3z" className="cls-3" />
      <path id={`Fill-7-${suffix}`} d="M15 17h-5V7h5z" className="cls-3" />
    </g>
  </svg>
)}
export default SvgCloudInterconnect
