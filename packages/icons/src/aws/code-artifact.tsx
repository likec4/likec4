import type { SVGProps } from 'react'
const SvgCodeArtifact = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={80} height={80} {...props}>
    <defs>
      <linearGradient id="CodeArtifact_svg__a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#2E27AD" />
        <stop offset="100%" stopColor="#527FFF" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#CodeArtifact_svg__a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="m36.848 46.128 5.925-13.235 1.826.818-5.925 13.234zm8.295-4.031 3.559-2.596-3.135-3.18 1.424-1.404 3.949 4.005a.999.999 0 0 1-.122 1.51l-4.495 3.28zm-8.839-5.69-3.61 2.635 3.144 3.18-1.422 1.406-3.962-4.005a1.002 1.002 0 0 1 .122-1.511l4.548-3.32zm-1.152-22.686L15 25.636v23.235h-2V25.066a1 1 0 0 1 .492-.861L34.134 12zM68 30.871v24.064a1 1 0 0 1-.501.867L46.873 67.678l-.998-1.733L66 54.357V30.871zM56 48.664l-15.08 8.575L26 48.496V31.172l14.91-8.573L56 31.347zm2 .582V30.771a1 1 0 0 0-.498-.866l-16.088-9.326a1 1 0 0 0-1-.002l-15.912 9.15a1 1 0 0 0-.502.867v18.475c0 .355.189.683.494.863l15.913 9.325a1 1 0 0 0 1 .006l16.087-9.148a1 1 0 0 0 .506-.869"
      />
    </g>
  </svg>
)
export default SvgCodeArtifact
