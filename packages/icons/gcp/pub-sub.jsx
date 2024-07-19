/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgPubSub = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <filter
        id="luminosity-noclip"
        width={14.73}
        height={12.76}
        x={4.64}
        y={4.19}
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodColor="#fff" result="bg" />
        <feBlend in="SourceGraphic" in2="bg" />
      </filter>
      <style>{'.cls-2{fill:#669df6}.cls-4{fill:#4285f4}.cls-5{fill:#aecbfa}'}</style>
      <mask id="mask" width={14.73} height={12.76} x={4.64} y={4.19} maskUnits="userSpaceOnUse">
        <circle cx={12} cy={12.23} r={3.58} filter="url(#luminosity-noclip)" />
      </mask>
    </defs>
    <g data-name="Product Icons">
      <circle cx={18.97} cy={8.21} r={1.72} className="cls-2" />
      <circle cx={5.03} cy={8.21} r={1.72} className="cls-2" />
      <circle cx={12} cy={20.28} r={1.72} className="cls-2" />
      <g mask="url(#mask)">
        <path d="m11.646 12.86.795-1.384 6.995 4.02-.795 1.384z" className="cls-4" />
        <path d="m4.633 15.573 6.963-4.02.795 1.377-6.963 4.02z" className="cls-4" />
        <path d="M11.2 4.19h1.59v8.04H11.2z" className="cls-4" />
      </g>
      <circle cx={12} cy={12.23} r={2.78} className="cls-5" />
      <circle cx={5.03} cy={16.25} r={2.19} className="cls-5" />
      <circle cx={18.97} cy={16.25} r={2.19} className="cls-5" />
      <circle cx={12} cy={4.19} r={2.19} className="cls-5" />
    </g>
  </svg>
)
export default SvgPubSub
