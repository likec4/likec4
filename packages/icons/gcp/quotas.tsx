// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgQuotas = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:#669df6}.cls-2{fill:#4285f4}'}</style>
    </defs>
    <g data-name="Product Icons">
      <g data-name="colored-32/quotas">
        <path
          d="M6 2H4v18.58A1.31 1.31 0 0 0 5.29 22h13.44A1.29 1.29 0 0 0 20 20.58V2l-2 .14V20H6Z"
          className="cls-1"
        />
        <path id={`Path-2-${suffix}`} d="M12 22h6.73A1.29 1.29 0 0 0 20 20.58V2h-2v18h-6z" className="cls-2" data-name="Path" />
        <path id={`Rectangle-328-${suffix}`} d="M7 12h10v7H7z" className="cls-1" />
        <path id={`Rectangle-328-2-${suffix}`} d="M12 12h5v7h-5z" className="cls-2" data-name="Rectangle-328" />
      </g>
      <path d="M7 3h1v3H7z" className="cls-1" />
      <path d="M7.5 3H8v3h-.5z" className="cls-2" />
      <path d="M10 3h1v3h-1zM13 3h1v3h-1zM16 3h1v3h-1z" className="cls-1" />
      <path d="M10.5 3h.5v3h-.5zM13.5 3h.5v3h-.5zM16.5 3h.5v3h-.5z" className="cls-2" />
    </g>
  </svg>
)}
export default SvgQuotas
