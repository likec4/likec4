// @ts-nocheck

import type { SVGProps } from 'react'
const SvgGitter = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 0 256 256" {...props}>
    <defs>
      <linearGradient id="Gitter_svg__a" x1="50%" x2="50%" y1="0%" y2="100%">
        <stop offset="0%" stopColor="#FB0766" />
        <stop offset="100%" stopColor="#C50948" />
      </linearGradient>
    </defs>
    <path fill="url(#Gitter_svg__a)" d="M0 0h256v256H0z" />
    <path
      fill="#FFF"
      d="M83.914 62.873h12.525v82.661H83.914zm76.149 20.039h12.524v62.622h-12.524zm-50.599 0h12.524v110.466h-12.524zm25.049 0h12.525v110.466h-12.525z"
    />
  </svg>
)
export default SvgGitter
