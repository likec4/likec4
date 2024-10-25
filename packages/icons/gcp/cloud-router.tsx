// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCloudRouter = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <g data-name="Product Icons">
      <path
        d="M19 14v3l-5-5 5-5v3h3v4ZM5 10H2v4h3v3l5-5-5-5Zm9 7v-3h-4v3H7l5 5 5-5Zm0-10v3h-4V7H7l5-5 5 5Z"
        data-name="24 router"
        fill="#4285f4"
      />
    </g>
  </svg>
)}
export default SvgCloudRouter
