// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgFirestore = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-2{fill:#aecbfa}'}</style>
    </defs>
    <g data-name="Product Icons">
      <g data-name="colored-32/firestore">
        <path d="m21 13-9-4v4l9 4Zm0-7-9-4v4l9 4Z" fill="#669df6" />
        <path id={`Rectangle-7-${suffix}`} d="m3 6 9-4v4l-9 4z" className="cls-2" />
        <path id={`Rectangle-7-2-${suffix}`} d="m3 13 9-4v4l-9 4z" className="cls-2" data-name="Rectangle-7" />
        <path id={`Rectangle-7-3-${suffix}`} d="m12 18 3.37-1.5 4.51 2L12 22z" data-name="Rectangle-7" fill="#4285f4" />
      </g>
    </g>
  </svg>
)}
export default SvgFirestore
