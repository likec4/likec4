// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCloudVisionApi = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-2{fill:#669df6}.cls-3{fill:#aecbfa}'}</style>
    </defs>
    <g data-name="Product Icons">
      <g data-name="colored-32/vision">
        <path d="M0 0h24v24H0z" fill="none" />
        <path d="m6 12 6 4.99V20L2 12z" className="cls-2" />
        <path id={`Shape-2-${suffix}`} d="M12 16.99 18 12h4l-10 8z" className="cls-2" data-name="Shape" />
        <path id={`Shape-3-${suffix}`} d="m2 12 10-8v3.01L6 12z" className="cls-3" data-name="Shape" />
        <path id={`Shape-4-${suffix}`} d="M12 7.01 18 12h4L12 4z" className="cls-3" data-name="Shape" />
        <circle id={`Oval-${suffix}`} cx={12} cy={12} r={2} fill="#4285f4" />
      </g>
    </g>
  </svg>
)}
export default SvgCloudVisionApi
