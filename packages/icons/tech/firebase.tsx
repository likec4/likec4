// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgFirebase = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path
      fill="#f58220"
      d="m27.35 80.52 10.68-68.44c.37-2.33 3.5-2.89 4.6-.8l11.48 21.48zm75.94 16.63L93.1 34.11c-.31-1.96-2.76-2.76-4.17-1.35L24.71 97.15l35.54 19.95a7.45 7.45 0 0 0 7.18 0zm-28.85-55L66.21 26.5c-.92-1.78-3.44-1.78-4.36 0L25.7 90.95z"
    />
  </svg>
)}
export default SvgFirebase
