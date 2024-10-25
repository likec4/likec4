// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgSolidity = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path d="M84.466 0 63.887 36.578H22.756L43.321 0z" opacity={0.45} />
    <path d="M63.887 36.576h41.145L84.468 0H43.323z" opacity={0.6} />
    <path d="m43.323 73.138 20.565-36.562L43.323 0 22.759 36.576z" opacity={0.8} />
    <path d="M43.521 128 64.1 91.424h41.145L84.666 128z" opacity={0.45} />
    <path d="M64.1 91.426H22.955l20.564 36.575h41.145z" opacity={0.6} />
    <path d="M84.666 54.864 64.102 91.426l20.564 36.575 20.579-36.575z" opacity={0.8} />
  </svg>
)}
export default SvgSolidity
