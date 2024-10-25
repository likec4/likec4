// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgStackdriver = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path d="m11.19 11.35 4.56-7.84h-9l-4.5 7.84z" fill="#aecbfa" />
    <path d="m2.25 12.65 4.49 7.84h8.99l-4.48-7.84z" fill="#4285f4" />
    <path d="m21.75 12-4.5-7.87L12.74 12l4.51 7.87Z" fill="#669df6" />
  </svg>
)}
export default SvgStackdriver
