import type { SVGProps } from 'react'
const SvgWorkDocs = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={80} height={80} {...props}>
    <defs>
      <linearGradient id="WorkDocs_svg__a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#BD0816" />
        <stop offset="100%" stopColor="#FF5252" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#WorkDocs_svg__a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M33 41h3v-2h-3zm6 20h2v-3h-2zm0-5h2v-3h-2zm0-10h2v-3h-2zm0 5h2v-3h-2zM28 41h3v-2h-3zm-5 0h3v-2h-3zm-5 0h3v-2h-3zm23 25v-3h-2v3H14V41h2v-2h-2V14h25v25h-1v2h28v25zm0-50.586L64.586 39H41zM68 40a1 1 0 0 0-.293-.707l-27-27A1 1 0 0 0 40 12H13a1 1 0 0 0-1 1v54a1 1 0 0 0 1 1h54a1 1 0 0 0 1-1z"
      />
    </g>
  </svg>
)
export default SvgWorkDocs
