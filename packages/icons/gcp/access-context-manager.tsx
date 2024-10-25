// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAccessContextManager = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <g data-name="Product Icons">
      <path
        d="M12 19.27 4.72 12 12 4.72l3.64 3.64L17 7l-5-5L2 12l10 10 5-5-1.36-1.36z"
        fill="#aecbfa"
        fillRule="evenodd"
      />
      <path d="M18.36 8.36 22 12l-3.64 3.64z" fillRule="evenodd" fill="#4285f4" />
      <path d="M12 8.36 15.64 12 12 15.64z" fillRule="evenodd" fill="#669df6" />
    </g>
  </svg>
)}
export default SvgAccessContextManager
