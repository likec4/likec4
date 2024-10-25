// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgApigeeApiPlatform = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:#669df6;fill-rule:evenodd}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path
        id={`Fill-1-${suffix}`}
        d="m5.2 12 1.32-1.32-1.79-1.79a2.94 2.94 0 0 1 2.08-5 2.92 2.92 0 0 1 2.07.86l1.8 1.79L12 5.2l-1.79-1.79a4.81 4.81 0 1 0-6.8 6.8Z"
        className="cls-1"
      />
      <path
        id={`Fill-3-${suffix}`}
        d="m18.8 12-1.32 1.32 1.79 1.8a2.94 2.94 0 0 1-4.16 4.15l-1.79-1.79L12 18.8l1.79 1.79a4.81 4.81 0 1 0 6.8-6.8Z"
        className="cls-1"
      />
      <path
        id={`Fill-5-${suffix}`}
        d="M8.89 19.27a2.94 2.94 0 0 1-4.16-4.16l1.79-1.79 4.16 4.16Zm6.23-14.54a2.93 2.93 0 0 1 5 2.08 3 3 0 0 1-.86 2.08l-1.79 1.79-4.15-4.16ZM12 15.19A3.2 3.2 0 0 1 8.81 12 3.21 3.21 0 0 1 12 8.81 3.21 3.21 0 0 1 15.19 12 3.2 3.2 0 0 1 12 15.19M18.8 12l1.79-1.79a4.81 4.81 0 1 0-6.8-6.8L12 5.2 5.2 12l-1.79 1.79a4.81 4.81 0 1 0 6.8 6.8L12 18.8Z"
        fillRule="evenodd"
        fill="#4285f4"
      />
    </g>
  </svg>
)}
export default SvgApigeeApiPlatform
