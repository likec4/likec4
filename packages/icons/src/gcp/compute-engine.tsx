import type { SVGProps } from 'react'
const SvgComputeEngine = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:#aecbfa}.cls-2{fill:#669df6}.cls-3{fill:#4285f4}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path d="M9 9h6v6H9z" className="cls-1" />
      <path d="M11 2h2v4h-2zM7 2h2v4H7zM15 2h2v4h-2z" className="cls-2" />
      <path d="M11 18h2v4h-2zM7 18h2v4H7zM15 18h2v4h-2zM18 13v-2h4v2zM18 17v-2h4v2zM18 9V7h4v2z" className="cls-3" />
      <path d="M2 13v-2h4v2zM2 17v-2h4v2zM2 9V7h4v2z" className="cls-2" />
      <path d="M5 5v14h14V5Zm12 12H7V7h10Z" className="cls-1" />
      <path d="M9 15h6l-3-3z" className="cls-2" />
      <path d="m12 12 3 3V9z" className="cls-3" />
    </g>
  </svg>
)
export default SvgComputeEngine
