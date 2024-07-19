/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgCloudHealthcareApi = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-4{fill:#4285f4}.cls-6{fill:#669df6}'}</style>
      <mask id="mask" width={5.33} height={16.67} x={9.33} y={5.33} maskUnits="userSpaceOnUse">
        <path id="path-1" d="m12 22-.83-.77V6.67h1.66v14.56z" fill="#fff" fillRule="evenodd" />
      </mask>
    </defs>
    <g data-name="Product Icons">
      <path d="m12 22-.83-.77V6.67h1.66v14.56z" data-name="Mask" fillRule="evenodd" fill="#aecbfa" />
      <path d="M12 8a2.67 2.67 0 0 0 2.67-2.67H9.33A2.67 2.67 0 0 0 12 8" className="cls-4" mask="url(#mask)" />
      <path id="Line-2" d="M12.83 18.87h-1.66v-1.54h1.66z" className="cls-4" />
      <path d="M12.83 10.87h-1.66V9.33h1.66z" className="cls-4" />
      <circle cx={12} cy={4.67} r={2.67} fill="#aecbfa" />
      <path
        d="M16.67 10.17H6.83a1.17 1.17 0 0 0 0 2.33H10v1.67H6.83a2.84 2.84 0 0 1 0-5.67h9.84V7.33l3.33 2-3.33 2ZM12 7.33a2.67 2.67 0 0 0 2.67-2.66H9.33A2.67 2.67 0 0 0 12 7.33"
        className="cls-6"
      />
      <path
        d="M13.36 16.5H14a1.17 1.17 0 0 0 0-2.33h-1.17V12.5H14a2.84 2.84 0 0 1 0 5.67h-4v1.16l-3.33-2 3.33-2v1.17Z"
        className="cls-6"
      />
    </g>
  </svg>
)
export default SvgCloudHealthcareApi
