// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgProcessExplorer = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <path
      fill="#1f56a3"
      d="M13.022 16.764c-2.09-.28-2.055-1.624-2.045-3.8H7.061c.01 2.179.045 3.523-2.046 3.8a1.066 1.066 0 0 0-.984.958h9.981a1.07 1.07 0 0 0-.99-.958"
    />
    <rect width={18} height={12.747} y={0.278} fill="#1490df" rx={0.61} />
    <rect width={15.901} height={10.576} x={1.037} y={1.265} fill="#fff" rx={0.305} />
    <path
      fill="#76bc2d"
      d="M12.079 4.654a.15.15 0 0 0-.13.074l-.93 1.572a.15.15 0 0 1-.262-.006L9.333 3.581a.151.151 0 0 0-.276.022L7.719 7.575a.151.151 0 0 1-.281.011L6.281 4.905a.15.15 0 0 0-.27-.013l-1.593 2.9a.15.15 0 0 1-.132.078H1.037v.958h3.815a.15.15 0 0 0 .132-.078l.923-1.678a.151.151 0 0 1 .27.013l1.371 3.178a.15.15 0 0 0 .28-.011L9.25 6.031a.15.15 0 0 1 .275-.022l1.182 2.25a.151.151 0 0 0 .263.007l1.53-2.58a.15.15 0 0 1 .129-.074h4.314v-.958Z"
    />
  </svg>
)}
export default SvgProcessExplorer
