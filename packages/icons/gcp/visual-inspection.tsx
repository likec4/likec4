// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVisualInspection = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="m14.28 15.33 1.93 1.93L12 20.65 1.2 12H8a4 4 0 0 0 4 4 4.1 4.1 0 0 0 2.28-.67M16 12a4 4 0 0 1-.64 2.18l2.08 2.1L22.81 12Z"
      fill="#669df6"
      fillRule="evenodd"
    />
    <path d="M12 3.36 1.2 12H8a4 4 0 0 1 4-4 4 4 0 0 1 4 4h6.79Z" fill="#aecbfa" fillRule="evenodd" />
    <path
      d="M12 9.57a2.37 2.37 0 0 1 1.71.71 2.4 2.4 0 0 1 0 3.43 2.41 2.41 0 0 1-3.42 0 2.4 2.4 0 0 1 0-3.43A2.37 2.37 0 0 1 12 9.57"
      fill="#4285f4"
      fillRule="evenodd"
    />
  </svg>
)}
export default SvgVisualInspection
