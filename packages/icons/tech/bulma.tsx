// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgBulma = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path fill="#00D1B2" d="m59.2 0 40 40-24 24 32 31.9L59.4 128l-40-39.9 7.7-56z" />
  </svg>
)}
export default SvgBulma
