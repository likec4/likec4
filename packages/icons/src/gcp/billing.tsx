import type { SVGProps } from 'react'
const SvgBilling = (props: SVGProps<SVGSVGElement>) => (
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
        fill="#85A4E6"
        d="M22.5 20.2h-21c-.8 0-1.5-.7-1.5-1.5V5.2c0-.8.7-1.5 1.5-1.5h21c.8 0 1.5.7 1.5 1.5v13.5c0 .9-.7 1.5-1.5 1.5"
      />
      <path fill="#5C85DE" d="M22.5 20.2H12V3.8h10.5c.8 0 1.5.7 1.5 1.5v13.5c0 .8-.7 1.4-1.5 1.4" />
      <path fill="#5C85DE" d="M0 6h24v3H0z" />
      <path fill="#3367D6" d="M12 6h12v3H12z" />
      <path fill="#FFF" d="M2.2 10.5h19.5v2.2H2.2z" />
      <path fill="#5C85DE" d="M2.2 15h4.5v3H2.2z" />
      <path fill="#FFF" d="M13.5 15.8H15v1.5h-1.5zM16.5 15.8H18v1.5h-1.5zM19.5 15.8H21v1.5h-1.5z" />
    </g>
  </svg>
)
export default SvgBilling
