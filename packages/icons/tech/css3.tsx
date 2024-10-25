// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCss3 = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path fill="#1572B6" d="M18.814 114.123 8.76 1.352h110.48l-10.064 112.754-45.243 12.543z" />
    <path fill="#33A9DC" d="m64.001 117.062 36.559-10.136 8.601-96.354h-45.16z" />
    <path fill="#fff" d="M64.001 51.429h18.302l1.264-14.163H64.001V23.435h34.682l-.332 3.711-3.4 38.114h-30.95z" />
    <path
      fill="#EBEBEB"
      d="m64.083 87.349-.061.018-15.403-4.159-.985-11.031H33.752l1.937 21.717 28.331 7.863.063-.018z"
    />
    <path fill="#fff" d="m81.127 64.675-1.666 18.522-15.426 4.164v14.39l28.354-7.858.208-2.337 2.406-26.881z" />
    <path
      fill="#EBEBEB"
      d="M64.048 23.435v13.831H30.64l-.277-3.108-.63-7.012-.331-3.711zm-.047 27.996v13.831H48.792l-.277-3.108-.631-7.012-.33-3.711z"
    />
  </svg>
)}
export default SvgCss3
