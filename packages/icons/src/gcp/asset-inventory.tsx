import type { SVGProps } from 'react'
const SvgAssetInventory = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} {...props}>
    <path
      d="M10.75 10.61h2.57v2.57h-2.57z"
      style={{
        fill: '#4285f4'
      }}
      transform="rotate(-45.01 12.037 11.901)"
    />
    <path
      d="m17.87 11.89-.07.06-3.77 3.78-1.06-1.05 2.8-2.79-5.71-5.71v-2.1l.07.07z"
      style={{
        fill: '#669df6',
        fillRule: 'evenodd'
      }}
    />
    <path
      d="m10.06 6.18-5.7 5.71 6.75 6.76-1.05 1.05-.06-.07-7.75-7.74 7.81-7.81z"
      style={{
        fill: '#aecbfa',
        fillRule: 'evenodd'
      }}
    />
    <path
      d="M13.94 17.6v2.1l-.06-.07-7.75-7.73 3.84-3.85 1.06 1.06-2.8 2.79z"
      style={{
        fill: '#669df6',
        fillRule: 'evenodd'
      }}
    />
    <path
      d="m13.94 17.6 5.7-5.7-6.75-6.76 1.05-1.06.06.07 7.75 7.75-.07.06-7.74 7.74z"
      style={{
        fill: '#4285f4'
      }}
    />
  </svg>
)
export default SvgAssetInventory
