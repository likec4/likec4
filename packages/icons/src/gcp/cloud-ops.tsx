import type { SVGProps } from 'react'
const SvgCloudOps = (props: SVGProps<SVGSVGElement>) => (
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
    <g transform="translate(0 1)">
      <path
        fill="#5982DB"
        d="M23.4 11.2c0 2.9-1.1 5.8-3.3 8-4.4 4.4-11.5 4.4-15.9 0S-.2 7.7 4.2 3.3c4.1-4.1 10.7-4.4 15.1-.8l-4.8 4.8c-1.7-1-4-.8-5.5.7-1.8 1.8-1.8 4.6 0 6.4s4.6 1.8 6.4 0c.9-.9 1.3-2 1.3-3.2h2.2c0 1.7-.7 3.5-2 4.8-2.6 2.6-6.9 2.6-9.5 0s-2.6-7 0-9.6c2.4-2.4 6-2.6 8.7-.7l1.6-1.6C14.1 1.3 9 1.6 5.8 4.8c-3.5 3.5-3.5 9.2 0 12.7s9.2 3.5 12.7 0c1.8-1.8 2.6-4.1 2.6-6.4h2.3z"
      />
      <path fill="#3367D6" d="M12.7 9c-3.2-.4-3.3 2.8-2.2 3.8 1.1.9 2.3.9 3.2 0 .6-.6.8-1.4.6-2.2L20.9 4l-1.6-1.6z" />
      <circle cx={2.8} cy={7.8} r={2.6} fill="#3367D6" />
      <circle cx={18.5} cy={19} r={2.6} fill="#3367D6" />
      <circle cx={11} cy={5.5} r={1.9} fill="#3367D6" />
    </g>
  </svg>
)
export default SvgCloudOps
