// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgTransfer = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fill="#4285F4"
      fillRule="evenodd"
      d="M14 5V2.5L21 7l-7 4.5V9H5.115a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm-4 7.5V15h8.831a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H10v2.5L3 17z"
    />
  </svg>
)}
export default SvgTransfer
