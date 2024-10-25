// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgWorkloadIdentityPool = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" data-name="Artwork" viewBox="0 0 24 24" {...props}>
    <rect
      width={18}
      height={12}
      x={3}
      y={6}
      fill="none"
      stroke="#4285f4"
      strokeMiterlimit={10}
      strokeWidth={2}
      rx={1}
    />
    <path fill="none" stroke="#669df6" strokeMiterlimit={10} d="M14.002 10.471h4M14.002 13.512h4" />
    <path fill="none" stroke="#aecbfa" strokeMiterlimit={10} d="M6.492 9.49h5.007v5.007H6.492z" />
    <path fill="#4285f4" d="M8.003 11.009h2.014V13H8.003z" />
  </svg>
)}
export default SvgWorkloadIdentityPool
