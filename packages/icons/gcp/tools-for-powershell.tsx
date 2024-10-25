// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgToolsForPowershell = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>
        {'.cls-1{fill:#669df6}.cls-1,.cls-2,.cls-3{fill-rule:evenodd}.cls-2{fill:#4285f4}.cls-3{fill:#aecbfa}'}
      </style>
    </defs>
    <g data-name="Product Icons">
      <path d="m6.68 16.3-2.41-4.26 2.41-4.25H4.42L2 12.04l2.42 4.26z" className="cls-1" />
      <path d="m4.57 12.56-.3-.52H2l1.11 1.97z" className="cls-2" />
      <path
        d="M15 6.37H9.12L5.81 12l3.31 5.59H15L18.29 12zm-2.93 8.36a2.64 2.64 0 1 1 2.66-2.64 2.65 2.65 0 0 1-2.66 2.64M4.27 12.06l2.41-4.27H4.42L2 12.06l1.11 1.97z"
        className="cls-3"
      />
      <path
        d="m15 6.45-1.7 3.33a2.66 2.66 0 0 1-1.25 5 2.6 2.6 0 0 1-1.18-.27l-1.75 3.12H15L18.29 12z"
        className="cls-1"
      />
      <path d="m17.32 7.79 2.41 4.25-2.41 4.26h2.27L22 12.04l-2.41-4.25z" className="cls-1" />
      <path d="m19.43 11.53.3.51H22l-1.11-1.97z" className="cls-2" />
      <path d="m19.73 12.02-2.41 4.28h2.27L22 12.02l-1.11-1.97z" className="cls-3" />
    </g>
  </svg>
)}
export default SvgToolsForPowershell
