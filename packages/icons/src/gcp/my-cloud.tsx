import type { SVGProps } from 'react'
const SvgMyCloud = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 24 24" {...props}>
    <path fill="none" d="M0 1h24v24H0z" />
    <g transform="translate(2 8)">
      <defs>
        <filter id="a" width={24} height={24} x={-2} y={-7} filterUnits="userSpaceOnUse">
          <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" />
        </filter>
      </defs>
      <mask id="b" width={24} height={24} x={-2} y={-7} maskUnits="userSpaceOnUse">
        <g filter="url(#a)">
          <path
            fill="#FFF"
            fillRule="evenodd"
            d="M16.4 3.5c2.3.2 4.1 2 4.1 4.3 0 2.4-2 4.3-4.4 4.3H4.8c-2.9 0-5.2-2.3-5.2-5.2 0-2.7 2-4.9 4.7-5.1 1-2.1 3.2-3.6 5.7-3.6 3.2 0 5.8 2.3 6.4 5.3m-.3 6.8c1.5 0 2.6-1.2 2.6-2.6s-1.2-2.6-2.6-2.6h-1.3v-.4C14.8 2.1 12.7 0 10 0 7.8 0 5.9 1.4 5.4 3.4h-.6c-2 0-3.6 1.6-3.6 3.5s1.6 3.4 3.5 3.4z"
            clipRule="evenodd"
          />
        </g>
      </mask>
      <path fill="#5C85DE" fillRule="evenodd" d="M-2 17h24V-7H-2z" clipRule="evenodd" mask="url(#b)" />
    </g>
  </svg>
)
export default SvgMyCloud
