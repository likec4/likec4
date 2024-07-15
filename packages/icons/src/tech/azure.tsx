import type { SVGProps } from 'react'
const SvgAzure = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <defs>
      <linearGradient id="Azure_svg__a" x1={60.919} x2={18.667} y1={9.602} y2={134.423} gradientUnits="userSpaceOnUse">
        <stop stopColor="#114A8B" />
        <stop offset={1} stopColor="#0669BC" />
      </linearGradient>
      <linearGradient id="Azure_svg__b" x1={74.117} x2={64.344} y1={67.772} y2={71.076} gradientUnits="userSpaceOnUse">
        <stop stopOpacity={0.3} />
        <stop offset={0.071} stopOpacity={0.2} />
        <stop offset={0.321} stopOpacity={0.1} />
        <stop offset={0.623} stopOpacity={0.05} />
        <stop offset={1} stopOpacity={0} />
      </linearGradient>
      <linearGradient id="Azure_svg__c" x1={68.742} x2={115.122} y1={5.961} y2={129.525} gradientUnits="userSpaceOnUse">
        <stop stopColor="#3CCBF4" />
        <stop offset={1} stopColor="#2892DF" />
      </linearGradient>
    </defs>
    <path
      fill="url(#Azure_svg__a)"
      d="M46.09.002h40.685L44.541 125.137a6.485 6.485 0 0 1-6.146 4.413H6.733a6.48 6.48 0 0 1-5.262-2.699 6.47 6.47 0 0 1-.876-5.848L39.944 4.414A6.49 6.49 0 0 1 46.09 0z"
      transform="translate(.587 4.468)scale(.91904)"
    />
    <path
      fill="#0078d4"
      d="M97.28 81.607H37.987a2.743 2.743 0 0 0-1.874 4.751l38.1 35.562a6 6 0 0 0 4.087 1.61h33.574z"
    />
    <path
      fill="url(#Azure_svg__b)"
      d="M46.09.002A6.43 6.43 0 0 0 39.93 4.5L.644 120.897a6.47 6.47 0 0 0 6.106 8.653h32.48a6.94 6.94 0 0 0 5.328-4.531l7.834-23.089 27.985 26.101a6.62 6.62 0 0 0 4.165 1.519h36.396l-15.963-45.616-46.533.011L86.922.002z"
      transform="translate(.587 4.468)scale(.91904)"
    />
    <path
      fill="url(#Azure_svg__c)"
      d="M98.055 4.408A6.48 6.48 0 0 0 91.917.002H46.575a6.48 6.48 0 0 1 6.137 4.406l39.35 116.594a6.476 6.476 0 0 1-6.137 8.55h45.344a6.48 6.48 0 0 0 6.136-8.55z"
      transform="translate(.587 4.468)scale(.91904)"
    />
  </svg>
)
export default SvgAzure
