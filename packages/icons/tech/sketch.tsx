// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgSketch = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path fill="#fdb300" d="M29.62 12.85 64 9.24l34.38 3.61L125 48.29l-61 70.47L3 48.29z" />
    <path fill="#ea6c00" d="M27.71 48.29 64 118.76 3 48.29zm72.58 0L64 118.76l61-70.47z" />
    <path fill="#fdad00" d="M27.71 48.29h72.58L64 118.76z" />
    <path fill="#fdd231" d="m64 9.24-34.38 3.61-1.91 35.44zm0 0 34.38 3.61 1.91 35.44z" />
    <path fill="#fdad00" d="M125 48.29 98.38 12.85l1.91 35.44z" />
    <path fill="#feeeb7" d="M64 9.24 27.71 48.29h72.58z" />
    <path fill="#fdad00" d="m3 48.29 26.62-35.44-1.91 35.44z" />
  </svg>
)}
export default SvgSketch
