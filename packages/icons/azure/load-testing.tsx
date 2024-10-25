// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgLoadTesting = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={8.995}
        x2={9.092}
        y1={778.607}
        y2={787.531}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#198ab3" />
        <stop offset={0.679} stopColor="#31d1f3" />
        <stop offset={1} stopColor="#32d4f5" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={8.997}
        x2={8.997}
        y1={791.404}
        y2={786.087}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.801} stopColor="#005ba1" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M13.233 12.922H4.767c-.27 0-.429-.431-.277-.654l2.919-4.256a.35.35 0 0 0 .059-.2V5.008a.17.17 0 0 0-.168-.166h-.157a.336.336 0 0 1-.335-.335v-.144a.337.337 0 0 1 .335-.336h3.709a.337.337 0 0 1 .335.336v.151a.334.334 0 0 1-.335.334H10.7a.167.167 0 0 0-.167.167v2.814a.34.34 0 0 0 .058.2l2.92 4.249c.155.213-.011.644-.278.644"
    />
    <path
      fill="#fff"
      d="M5.739 11.786 7.958 8.55a.8.8 0 0 0 .142-.457v-1.3a.26.26 0 0 1 .258-.257H9.62a.26.26 0 0 1 .257.256v1.393a.54.54 0 0 0 .1.308l2.265 3.293a.2.2 0 0 1-.053.269.2.2 0 0 1-.107.033H5.905a.2.2 0 0 1-.2-.191.2.2 0 0 1 .034-.111"
    />
    <path
      fill="#3cd4c2"
      d="M6.405 10.819a4.15 4.15 0 0 1 3.717-.421s.811.454 1.1-.084l1.046 1.453a.28.28 0 0 1-.061.393.3.3 0 0 1-.161.052H5.914a.28.28 0 0 1-.279-.281.3.3 0 0 1 .056-.169Z"
    />
    <path
      fill="#0078d4"
      d="M9 .105 1.242 4.543v8.865L9 17.9l7.758-4.438v-8.9Zm6.325 12.423L9 16.185l-6.325-3.618V5.422L9 1.766l6.325 3.666Z"
    />
    <path fill={`url(#b-${suffix})`} d="m16.753 4.565-1.428.864L9 1.772 2.675 5.429l-1.433-.88L9 .112Z" />
  </svg>
)}
export default SvgLoadTesting
