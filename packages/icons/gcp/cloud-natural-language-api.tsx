// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCloudNaturalLanguageApi = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:#669df6}.cls-2{fill:#4285f4}.cls-3{fill:#aecbfa}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path d="M20 5h-3v2h3v12h-3v2h5V5z" className="cls-1" />
      <path d="m20 8 2-1h-2zM22 18l-2 1h2z" className="cls-2" />
      <path d="M4 21h3v-2H4V7h3V5H2v16z" className="cls-1" />
      <g data-name="Shape">
        <path d="m2 18 2 1H2zM4 8 2 7h2z" className="cls-2" />
      </g>
      <path id={`Rectangle-7-Copy-${suffix}`} d="M7 12h10v2H7z" className="cls-3" />
      <path id={`Rectangle-7-Copy-2-${suffix}`} d="M7 15h10v2H7z" className="cls-3" data-name="Rectangle-7-Copy" />
      <path id={`Rectangle-7-Copy-3-${suffix}`} d="M7 9h10v2H7z" className="cls-3" data-name="Rectangle-7-Copy" />
    </g>
  </svg>
)}
export default SvgCloudNaturalLanguageApi
