// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgKeyManagementService = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <g data-name="Product Icons">
      <path
        d="M11.32 17.06H10v1.4h1.37v.63h1.43v-6.91a3.47 3.47 0 0 0 2.67-3.34 3.42 3.42 0 1 0-4.1 3.36v2.12H9.26v1.4h2.06ZM12 2l8.21 3.42v5.63c0 5.06-3.5 9.8-8.21 11-4.71-1.15-8.21-5.89-8.21-10.95V5.42Zm0 5a1.88 1.88 0 0 1 .72 3.62A1.88 1.88 0 1 1 12 7"
        fill="#669df6"
        fillRule="evenodd"
      />
      <path
        d="M12 19.09h.75v-6.91a3.47 3.47 0 0 0 2.67-3.34A3.42 3.42 0 0 0 12 5.42V2l8.21 3.42v5.63c0 5.06-3.5 9.8-8.21 11zM12 7a1.88 1.88 0 0 1 .72 3.62 1.1 1.1 0 0 1-.72.15Z"
        fillRule="evenodd"
        fill="#4285f4"
      />
    </g>
  </svg>
)}
export default SvgKeyManagementService
