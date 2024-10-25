// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgProfiler = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:#669df6}'}</style>
    </defs>
    <g data-name="Product Icons">
      <g data-name="colored-32/profiler">
        <path
          d="M8 2h8v2H8zM16.54 7.43l-.13.13L18 9.16l.12-.16a8 8 0 0 0-1.58-1.57M20.61 6.55l-1.6-1.6-2.41 2.41 2.51.69z"
          className="cls-1"
        />
        <path d="m16.6 7.36-.06.07A8 8 0 0 1 18.12 9l1-1Z" fill="#4285f4" />
        <circle id={`Oval-${suffix}`} cx={12} cy={14} r={4} className="cls-1" />
        <path id={`Oval-2-${suffix}`} d="M12 18a4 4 0 1 0 0-8v4l-3.27 2.32A4 4 0 0 0 12 18" data-name="Oval" fill="#aecbfa" />
        <path d="M12 22a8 8 0 1 1 8-8 8 8 0 0 1-8 8m0-2a6 6 0 1 0-6-6 6 6 0 0 0 6 6" className="cls-1" />
      </g>
    </g>
  </svg>
)}
export default SvgProfiler
