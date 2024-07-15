import type { SVGProps } from 'react'
const SvgCloudComposer = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} {...props}>
    <defs>
      <style>{'.Cloud-Composer_svg__cls-1{fill:#aecbfa}.Cloud-Composer_svg__cls-2{fill:#4285f4}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path d="M10.03 5.96H4.68V2h14.63v3.94h-5.3v5.33h-3.98z" className="Cloud-Composer_svg__cls-1" />
      <path
        d="M4.68 7.37h3.95v5.3h5.34V22h-3.94v-5.35H4.68zM15.38 7.36h3.94V22h-3.94z"
        className="Cloud-Composer_svg__cls-2"
      />
      <path d="M8.6 22H4.68v-3.94H8.6z" className="Cloud-Composer_svg__cls-1" />
    </g>
  </svg>
)
export default SvgCloudComposer
