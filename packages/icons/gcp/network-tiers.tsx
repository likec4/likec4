// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgNetworkTiers = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:#669df6}.cls-2{fill:#aecbfa}.cls-3{fill:#4285f4}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path
        d="M7.3 15.7A5.92 5.92 0 0 1 6 12H2a9.9 9.9 0 0 0 2.46 6.54ZM12 2a10 10 0 0 0-6.55 2.45l2.84 2.84A6 6 0 0 1 18 12h4A10 10 0 0 0 12 2"
        className="cls-1"
      />
      <circle id={`Oval-2-${suffix}`} cx={8} cy={19} r={2} className="cls-2" />
      <circle id={`Oval-2-2-${suffix}`} cx={19} cy={16} r={2} className="cls-3" data-name="Oval-2" />
      <circle id={`Oval-2-3-${suffix}`} cx={14} cy={20} r={2} className="cls-1" data-name="Oval-2" />
      <path d="M6 12H2a10 10 0 0 0 .44 2.91l4-.79A6 6 0 0 1 6 12" className="cls-3" />
      <g data-name="colored-32/network-tiers">
        <circle id={`Oval-2-4-${suffix}`} cx={5} cy={8} r={2} className="cls-2" data-name="Oval-2" />
      </g>
      <path d="M17.61 9.88A6 6 0 0 1 18 12h4a10 10 0 0 0-.43-2.91Z" className="cls-3" />
    </g>
  </svg>
)}
export default SvgNetworkTiers
