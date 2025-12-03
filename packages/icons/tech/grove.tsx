// @ts-nocheck

import type { SVGProps } from 'react'
const SvgGrove = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 0 256 267" {...props}>
    <defs>
      <filter id="grove_svg__a" width="200%" height="200%" x="-50%" y="-50%" filterUnits="objectBoundingBox">
        <feOffset dy={1} in="SourceAlpha" result="shadowOffsetOuter1" />
        <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation={2} />
        <feColorMatrix
          in="shadowBlurOuter1"
          result="shadowMatrixOuter1"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.243359375 0"
        />
        <feMerge>
          <feMergeNode in="shadowMatrixOuter1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path fill="#92C83E" d="m37.067 181.009 35.27-67.787 28.107 47.396-35.822 57.315z" />
    <path fill="#4B843D" d="m59.662 212.422 67.236-131.164 36.373 68.338-51.804 89.83z" />
    <path
      fill="#92C83E"
      d="m102.098 236.12 93.138-190.133s30.31 34.72 37.475 50.702c6.613 14.88 4.96 47.947-5.511 73.849s-31.964 45.19-44.089 50.15c-50.151 22.045-81.013 15.432-81.013 15.432"
    />
    <path
      fill="#FFF"
      d="M248 124C248 55.662 192.338 0 124 0S0 55.662 0 124c0 62.827 47.396 115.182 108.569 122.898v13.226l25.902-12.675C197.85 242.489 248 189.03 248 124M124 225.956c-52.907 0-101.956-49.05-101.956-101.956S71.094 22.044 124 22.044 225.956 71.094 225.956 124 176.906 225.956 124 225.956"
      filter="url(#grove_svg__a)"
      transform="translate(4 3)"
    />
  </svg>
)
export default SvgGrove
