import type { SVGProps } from 'react'
const SvgPermissions = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    width={24}
    height={24}
    baseProfile="tiny"
    overflow="visible"
    {...props}
  >
    <path fill="none" d="M0 0h24v24H0z" />
    <g fillRule="evenodd">
      <path
        fill="#5C85DE"
        d="M12 12c2.9 0 5.2-2.3 5.2-5.2S14.9 1.6 12 1.6 6.8 3.9 6.8 6.8 9.1 12 12 12M12 14.7c-3.5 0-10.5 1.7-10.5 5.2v2.6h21v-2.6c0-3.5-7-5.2-10.5-5.2"
      />
      <path
        fill="#3367D6"
        d="M12 12c2.9 0 5.2-2.3 5.2-5.2S14.9 1.6 12 1.6zM12 14.7v7.8h10.5v-2.6c0-3.5-7-5.2-10.5-5.2"
      />
    </g>
  </svg>
)
export default SvgPermissions
