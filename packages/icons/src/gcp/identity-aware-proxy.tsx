import type { SVGProps } from 'react'
const SvgIdentityAwareProxy = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-2{fill:#669df6}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path
        d="M11.85 7a5.1 5.1 0 1 0 5.1 5.1 5.1 5.1 0 0 0-5.1-5.1m0 9.08a4 4 0 1 1 4-4 4 4 0 0 1-4 4.01Z"
        fill="#4285f4"
      />
      <path
        d="M13.77 12.71a2 2 0 0 0-.28-.22 3.11 3.11 0 0 0-2.61-.28 2.3 2.3 0 0 0-.89.47.86.86 0 0 0-.37.65v1h4.47v-.82a1 1 0 0 0-.32-.8M11.85 11.53a1.16 1.16 0 1 0-1.17-1.15 1.17 1.17 0 0 0 1.17 1.15"
        className="cls-2"
      />
      <path d="M20.78 10.72h-1.04l.77.77H18.3v.9h2.21l-.77.78h1.04L22 11.94z" fill="#aecbfa" />
      <path
        d="m17.54 8.5.64.64.98-.97v1.09l.73-.74V6.79h-1.73l-.73.74h1.09zM19.16 15.83l-.98-.97-.64.63.98.98h-1.09l.73.73h1.73v-1.73l-.73-.73zM3.35 10.65A1.35 1.35 0 1 0 4.71 12a1.35 1.35 0 0 0-1.36-1.35m0 2.1a.76.76 0 1 1 .76-.75.76.76 0 0 1-.76.75"
        className="cls-2"
      />
    </g>
  </svg>
)
export default SvgIdentityAwareProxy
