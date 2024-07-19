/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgCloudArmor = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:#aecbfa}.cls-2{fill:#669df6}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path
        d="m9.76 20.6-1.04-1.05 5.45-5.48 1.04 1.05zM7.03 18.32l-1.04-1.05 7.35-7.39 1.04 1.05zM5.34 14.98 4.3 13.93l4.88-4.9 1.04 1.05z"
        className="cls-1"
      />
      <path
        d="m12 3.61 6.78 3v4.55A9.71 9.71 0 0 1 12 20.48a9.7 9.7 0 0 1-6.78-9.31V6.63l6.78-3M12 2 3.75 5.68v5.49A11.17 11.17 0 0 0 11.85 22h.3a11.17 11.17 0 0 0 8.1-10.78V5.68z"
        className="cls-2"
      />
      <circle cx={14.69} cy={14.62} r={1.42} className="cls-2" />
      <circle cx={13.85} cy={10.45} r={1.42} className="cls-2" />
      <circle cx={9.69} cy={9.6} r={1.42} className="cls-2" />
    </g>
  </svg>
)
export default SvgCloudArmor
