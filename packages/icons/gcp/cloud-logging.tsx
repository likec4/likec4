// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCloudLogging = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:#4285f4}.cls-3{fill:#669df6}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path d="M6 11h4v2H6zM4 18h6v2H4z" className="cls-1" />
      <g data-name="colored-32/logs">
        <path d="M0 0h24v24H0z" fill="none" />
        <path id={`Fill-3-${suffix}`} d="M4 18h2V6H4z" className="cls-1" />
        <path id={`Fill-4-${suffix}`} d="M9 7h13V3H9z" className="cls-3" />
        <path id={`Fill-4-2-${suffix}`} d="M9 14h13v-4H9z" className="cls-3" data-name="Fill-4" />
        <path id={`Fill-4-3-${suffix}`} d="M9 21h13v-4H9z" className="cls-3" data-name="Fill-4" />
        <path id={`Fill-7-${suffix}`} d="M2 8h6V2H2z" fill="#aecbfa" />
      </g>
    </g>
  </svg>
)}
export default SvgCloudLogging
