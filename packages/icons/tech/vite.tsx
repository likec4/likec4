// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVite = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path fill="#006bff" d="M128 3.83 48.72 22.547 36.977 124.17ZM39.464 24.264 0 33.167l35.658 90.604Z" />
  </svg>
)}
export default SvgVite
