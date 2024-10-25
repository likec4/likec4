// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCloudAssetInventory = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <g fill="#4285F4" fillRule="evenodd">
      <path d="m14.114 4-.974.974 7.089 7.072-6.115 6.114-6.113-6.114 2.92-2.922-.966-.964-3.886 3.886 8.045 8.045 8.047-8.045z" />
      <path d="m12.123 13.813-1.768-1.767 1.768-1.768 1.767 1.768z" />
      <path d="M10.045 4 2 12.046l8.045 8.045.964-.964-7.078-7.081 6.114-6.115 6.114 6.115-2.92 2.92.966.966 3.886-3.886z" />
    </g>
  </svg>
)}
export default SvgCloudAssetInventory
