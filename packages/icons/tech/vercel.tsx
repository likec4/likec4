// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVercel = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path d="M63.984 17.184 127.964 128H0Zm0 0" fillRule="nonzero" fill="#000" fillOpacity={1} />
  </svg>
)}
export default SvgVercel
