import type { SVGProps } from 'react'
const SvgSecurityHealthAdvisor = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" width={24} height={24} {...props}>
    <g transform="translate(16 4)">
      <defs>
        <filter id="Security-Health-Advisor_svg__a" width={17} height={28} x={-9} y={-6} filterUnits="userSpaceOnUse">
          <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" />
        </filter>
      </defs>
      <mask id="Security-Health-Advisor_svg__b" width={17} height={28} x={-9} y={-6} maskUnits="userSpaceOnUse">
        <g filter="url(#Security-Health-Advisor_svg__a)">
          <path
            fill="#FFF"
            fillRule="evenodd"
            d="M3 6H1V3.4l-5-2.2V-1l7 3zm0 1v.7C3 12.1-.7 17-4 17v-2c2 0 5-3.9 5-7.3V7z"
            clipRule="evenodd"
          />
        </g>
      </mask>
      <path
        fill="#AECBFA"
        fillRule="evenodd"
        d="M-9 22H8V-6H-9z"
        clipRule="evenodd"
        mask="url(#Security-Health-Advisor_svg__b)"
      />
    </g>
    <g transform="translate(6.667 4)">
      <defs>
        <filter id="Security-Health-Advisor_svg__c" width={17} height={28} x={-6.7} y={-6} filterUnits="userSpaceOnUse">
          <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" />
        </filter>
      </defs>
      <mask id="Security-Health-Advisor_svg__d" width={17} height={28} x={-6.7} y={-6} maskUnits="userSpaceOnUse">
        <g filter="url(#Security-Health-Advisor_svg__c)">
          <path
            fill="#FFF"
            fillRule="evenodd"
            d="M.5 9h-2c-.1-.4-.1-.9-.1-1.3V2l7-3v2.2l-5 2.2v4.4c-.1.3 0 .8.1 1.2m.2 1c.9 2.6 3.1 5 4.6 5v2c-2.7 0-5.7-3.4-6.7-7z"
            clipRule="evenodd"
          />
        </g>
      </mask>
      <path
        fill="#669DF6"
        fillRule="evenodd"
        d="M-6.7 22h17V-6h-17z"
        clipRule="evenodd"
        mask="url(#Security-Health-Advisor_svg__d)"
      />
    </g>
    <path
      fill="#4285F4"
      fillRule="evenodd"
      d="M7.8 12H2v1h6.3l1.7-2.5 3 6.1 2.3-4.6H22v-1h-7.3L13 14.4l-2.9-5.9z"
      clipRule="evenodd"
    />
    <path fill="none" d="M0 0h24v24H0z" />
  </svg>
)
export default SvgSecurityHealthAdvisor
