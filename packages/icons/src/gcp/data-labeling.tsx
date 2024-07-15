import type { SVGProps } from 'react'
const SvgDataLabeling = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} {...props}>
    <defs>
      <style>
        {'.Data-Labeling_svg__cls-1{fill:#a6cafd}.Data-Labeling_svg__cls-3{fill:#fff}.Data-Labeling_svg__cls-4{fill:#669df6}'}
      </style>
    </defs>
    <g data-name="Product Icons">
      <path
        d="M20 4H7.7a1.12 1.12 0 0 0-1 .63L3 12h2l3-6h11v1h2V5a1 1 0 0 0-1-1"
        className="Data-Labeling_svg__cls-1"
      />
      <circle
        cx={10}
        cy={12}
        r={3}
        style={{
          fill: '#559cfc'
        }}
      />
      <circle cx={10} cy={12} r={1} className="Data-Labeling_svg__cls-3" />
      <path id="Data-Labeling_svg__path-5" d="M0 0h8v1H0z" className="Data-Labeling_svg__cls-3" />
      <rect width={5} height={2} x={17} y={8} className="Data-Labeling_svg__cls-4" rx={1} />
      <rect width={8} height={2} x={14} y={11} className="Data-Labeling_svg__cls-4" rx={1} />
      <rect width={5} height={2} x={17} y={14} className="Data-Labeling_svg__cls-4" rx={1} />
      <path
        d="M19 17v1H8l-2-4H4l2.69 5.37a1.12 1.12 0 0 0 1 .63H20a1 1 0 0 0 1-1v-2Z"
        className="Data-Labeling_svg__cls-1"
      />
      <path
        d="M10 12H2"
        style={{
          fill: 'none',
          stroke: '#2683fb',
          strokeMiterlimit: 10
        }}
      />
    </g>
  </svg>
)
export default SvgDataLabeling
