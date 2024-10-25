// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDirectoryService = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#BD0816" />
        <stop offset="100%" stopColor="#FF5252" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill={`url(#a-${suffix})`} d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M34 51h3v-2h-3zm-9 0h7v-2h-7zm0-5h11v-2H25zm40 12V39h-2v14a1 1 0 0 1-1 1H42a1 1 0 0 1-1-1V39H22v19zm-20.926-6h15.844c-.438-3.017-2.74-5.716-5.766-6.675a5.7 5.7 0 0 1-2.201.454c-.754 0-1.5-.157-2.195-.447-3.036.967-5.274 3.619-5.682 6.668m9.635-8.67a3.58 3.58 0 0 0 1.885-3.145c0-1.987-1.634-3.604-3.643-3.604s-3.641 1.617-3.641 3.604c0 1.308.719 2.513 1.877 3.146a3.72 3.72 0 0 0 3.522-.001M61 33H43v15.75a10.4 10.4 0 0 1 4.808-4.784 5.56 5.56 0 0 1-1.498-3.781c0-3.09 2.531-5.604 5.641-5.604 3.111 0 5.643 2.514 5.643 5.604a5.55 5.55 0 0 1-1.49 3.767A10.48 10.48 0 0 1 61 48.787zm-39-5v9h19v-5a1 1 0 0 1 1-1h20a1 1 0 0 1 1 1v5h2v-9zm45-1v32a1 1 0 0 1-1 1H21a1 1 0 0 1-1-1V27a1 1 0 0 1 1-1h45a1 1 0 0 1 1 1M16 52h2v2h-3a1 1 0 0 1-1-1V21a1 1 0 0 1 1-1h46a1 1 0 0 1 1 1v3h-2v-2H16z"
      />
    </g>
  </svg>
)}
export default SvgDirectoryService
