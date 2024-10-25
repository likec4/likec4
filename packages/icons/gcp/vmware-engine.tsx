// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVMwareEngine = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fill="#4285f4"
      fillRule="evenodd"
      d="M6.344 13.507a4.28 4.28 0 0 1 4.282 4.278 4.28 4.28 0 0 1-4.282 4.278 4.28 4.28 0 0 1-4.281-4.278 4.28 4.28 0 0 1 4.281-4.278m-.034 1.866-.651.654 1.378 1.385-3.107-.001v.928h3.11l-1.381 1.386.65.654 2.495-2.503zm15.753-13.31v12.523h-4.32V18.9h-6.277a5.2 5.2 0 0 0 .083-1.83h4.363v-4.314h4.319V3.892h-8.873v4.315h-4.32v4.359a5.3 5.3 0 0 0-1.83.083V6.378h4.319V2.063zm-3.616 3.611v5.3h-4.319v4.315h-3.15a5.26 5.26 0 0 0-2.155-2.152V9.989h4.319V5.674z"
    />
  </svg>
)}
export default SvgVMwareEngine
