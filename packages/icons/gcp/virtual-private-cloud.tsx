// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVirtualPrivateCloud = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:#aecbfa}.cls-2{fill:#669df6}.cls-3{fill:#4285f4}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path d="M16 2h6v6h-6z" className="cls-1" />
      <path d="M19 2h3v6h-3z" className="cls-2" />
      <path d="M16 16h6v6h-6z" className="cls-1" />
      <path d="M19 16h3v6h-3z" className="cls-2" />
      <path d="M2 2h6v6H2z" className="cls-1" />
      <path d="M5 2h3v6H5z" className="cls-2" />
      <path d="M2 16h6v6H2z" className="cls-1" />
      <path d="M5 16h3v6H5zM8 4h8v2H8zM8 18h8v2H8zM18 8h2v8h-2zM4 8h2v8H4z" className="cls-2" />
      <path d="M4 8h2v2H4zM18 8h2v2h-2zM8 4h2v2H8zM8 18h2v2H8z" className="cls-3" />
    </g>
  </svg>
)}
export default SvgVirtualPrivateCloud
