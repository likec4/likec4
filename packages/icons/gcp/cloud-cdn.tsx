// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCloudCdn = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-2,.cls-3{fill:#669df6;fill-rule:evenodd}.cls-3{fill:#aecbfa}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path d="M2 2h20v20H2z" fill="none" />
      <path id={`Fill-1-${suffix}`} d="M12 2v2.41l3.13 3.22V5.21z" className="cls-2" />
      <path id={`Fill-1-Copy-2-${suffix}`} d="m19.5 12-3.12 3.13h2.5L22 12z" className="cls-2" />
      <path id={`Fill-1-Copy-3-${suffix}`} d="m4.5 12 3.13 3.13h-2.5L2 12z" className="cls-2" />
      <path id={`Fill-1-Copy-${suffix}`} d="M12 22v-2.41l3.13-3.21v2.41z" className="cls-2" />
      <path id={`Fill-2-${suffix}`} d="M12 2 8.88 5.21v2.42L12 4.41z" className="cls-3" />
      <path id={`Fill-2-Copy-2-${suffix}`} d="M18.88 8.88h-2.5L19.5 12H22z" className="cls-3" />
      <path id={`Fill-2-Copy-3-${suffix}`} d="M5.13 8.88h2.5L4.5 12H2z" className="cls-3" />
      <path id={`Fill-2-Copy-${suffix}`} d="m12 22-3.12-3.21v-2.41L12 19.59z" className="cls-3" />
      <path id={`Fill-9-${suffix}`} d="M15.13 15.13H8.88V8.88h6.25z" className="cls-3" />
      <path id={`Fill-10-${suffix}`} d="M15.13 8.88v6.25H8.88z" className="cls-2" />
      <path d="M15.13 8.88v6.25L12 12z" fillRule="evenodd" fill="#4285f4" />
    </g>
  </svg>
)}
export default SvgCloudCdn
