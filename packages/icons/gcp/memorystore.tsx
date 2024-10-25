// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgMemorystore = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:#669df6}.cls-2{fill:#4285f4;fill-rule:evenodd}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path
        d="M2 3.94h3.33v2.58H2zM2 8.45h3.33v2.58H2zM2 12.97h3.33v2.58H2zM2 17.48h3.33v2.58H2zM18.67 3.94H22v2.58h-3.33zM18.67 8.45H22v2.58h-3.33zM18.67 12.97H22v2.58h-3.33zM18.67 17.48H22v2.58h-3.33z"
        className="cls-1"
      />
      <path
        d="M21.33 6.52h-2.66V3.94zM21.33 11.03h-2.66V8.45zM21.33 15.55h-2.66v-2.58zM21.33 20.07h-2.66v-2.59z"
        className="cls-2"
      />
      <path d="M5.33 22h13.34V2H5.33Zm6-9H8l4.67-7.74V11H16l-4.67 7.74Z" fillRule="evenodd" fill="#aecbfa" />
      <path d="M11.33 22v-3.23L16 11.03h-3.33V2h6v20z" fill="#669df6" fillRule="evenodd" />
    </g>
  </svg>
)}
export default SvgMemorystore
